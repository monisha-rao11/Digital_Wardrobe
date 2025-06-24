import os
import uuid
import json
import base64
import datetime
import logging
import sys
import shutil
import zipfile
from io import BytesIO
from typing import Optional, Dict, List

import cv2
import numpy as np
from PIL import Image
from rembg import remove
import face_recognition

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, storage, firestore

# ---------------------------------
# Load Environment Variables & Setup
# ---------------------------------
load_dotenv()

# Essential environment variables
FIREBASE_SERVICE_ACCOUNT = os.getenv("FIREBASE_SERVICE_ACCOUNT")
FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET")
FIRESTORE_COLLECTION = os.getenv("FIRESTORE_COLLECTION", "clothing_items")
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", 16 * 1024 * 1024))  # 16MB default

# Constants for facial recognition
PROFILE_FILE = "profiles.json"
FACE_DATA_DIR = "face_data"

# Initialize Flask and SocketIO
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = MAX_UPLOAD_SIZE
CORS(app)
socketio = SocketIO(
    app, 
    cors_allowed_origins="*", 
    ping_timeout=120,         # Increased timeout
    ping_interval=25,
    async_mode='threading',   # Use threading mode for better stability
    logger=True,              # Enable socketio logging
    max_http_buffer_size=50 * 1024 * 1024,  # Increase to 50MB
    engineio_logger=True      # Enable engineio logging
)

# Ensure face data directory exists
os.makedirs(FACE_DATA_DIR, exist_ok=True)

# Configure Logging
# Set encoding to UTF-8 for stdout and stderr handlers
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log", encoding='utf-8'),
        logging.StreamHandler(stream=sys.stdout)  # This will ensure UTF-8 encoding for console output
    ]
)
logger = logging.getLogger("digital_wardrobe")

# ---------------------------------
# Firebase Setup
# ---------------------------------
db = None
bucket = None

def setup_firebase():
    """Initialize Firebase connections or return False if failed"""
    global db, bucket
    
    try:
        if not FIREBASE_SERVICE_ACCOUNT or not FIREBASE_STORAGE_BUCKET:
            logger.error("Firebase configuration missing in .env file")
            return False
        
        if not os.path.exists(FIREBASE_SERVICE_ACCOUNT):
            logger.error(f"Firebase service account file not found: {FIREBASE_SERVICE_ACCOUNT}")
            return False
        
        # Initialize Firebase
        cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT)
        firebase_admin.initialize_app(cred, {'storageBucket': FIREBASE_STORAGE_BUCKET})
        
        # Get storage and database references
        bucket = storage.bucket()
        db = firestore.client()
        
        # Quick connectivity test
        try:
            test_blobs = list(bucket.list_blobs(max_results=1))
            test_docs = list(db.collection(FIRESTORE_COLLECTION).limit(1).stream())
            logger.info(f"Firebase connection test passed - Storage: {FIREBASE_STORAGE_BUCKET}, Collection: {FIRESTORE_COLLECTION}")
        except Exception as e:
            logger.warning(f"Firebase connection test warning (but continuing): {str(e)}")
        
        logger.info(f"Firebase initialized successfully - Storage: {FIREBASE_STORAGE_BUCKET}")
        return True
        
    except Exception as e:
        logger.error(f"Firebase initialization failed: {str(e)}", exc_info=True)
        return False

# Initialize Firebase
firebase_ready = setup_firebase()
if not firebase_ready:
    logger.warning("Application will run with limited functionality (Firebase not available)")

# ---------------------------------
# Profile Utility Functions
# ---------------------------------
def load_profiles():
    if os.path.exists(PROFILE_FILE):
        with open(PROFILE_FILE, "r") as f:
            return json.load(f)
    return []

def save_profiles(profiles):
    with open(PROFILE_FILE, "w") as f:
        json.dump(profiles, f, indent=2)

# ---------------------------------
# Helper Functions
# ---------------------------------
def decode_base64_to_bytes(b64_data):
    """Decode base64-encoded image and return bytes."""
    try:
        # Check if base64 string has data URL prefix and remove it
        if ',' in b64_data:
            b64_data = b64_data.split(',', 1)[1]
        
        img_bytes = base64.b64decode(b64_data)
        logger.info(f"Successfully decoded base64 data to bytes (size: {len(img_bytes)} bytes)")
        return img_bytes
    except Exception as e:
        logger.error(f"Failed to decode base64 image: {e}")
        return None

def remove_background_from_bytes(img_bytes):
    """Remove image background using rembg from bytes."""
    try:
        output_data = remove(img_bytes)
        logger.info(f"Background removed successfully (output size: {len(output_data)} bytes)")
        return output_data
    except Exception as e:
        logger.error(f"Background removal failed: {e}")
        return None

def normalize_metadata(metadata):
    """Normalize metadata field names and structure."""
    logger.info(f"Original metadata received: {json.dumps(metadata)}")
    normalized = metadata.copy()
    
    # Map frontend field names to backend expected names
    field_mapping = {
        'userId': 'user_id',
        'profileId': 'profile_id',
        'subcategory': 'sub_category',
        'washingCondition': 'washing_conditions',
        'washingConditions': 'washing_conditions'
    }
    
    for frontend_field, backend_field in field_mapping.items():
        if frontend_field in normalized and backend_field not in normalized:
            normalized[backend_field] = normalized.pop(frontend_field)
    
    # Ensure colors is always a list
    if 'colors' in normalized and not isinstance(normalized['colors'], list):
        if isinstance(normalized['colors'], str):
            normalized['colors'] = [c.strip() for c in normalized['colors'].split(',') if c.strip()]
        else:
            normalized['colors'] = [str(normalized['colors'])]
    
    logger.info(f"Normalized metadata: {json.dumps(normalized)}")
    return normalized

def validate_metadata(metadata):
    """Validate that metadata contains all required fields."""
    required_fields = ['category', 'size', 'brand', 'user_id', 'profile_id']
    missing_fields = [field for field in required_fields if field not in metadata or not metadata[field]]
    
    # Check colors specially
    colors_valid = False
    if 'colors' in metadata:
        if isinstance(metadata['colors'], list) and len(metadata['colors']) > 0:
            colors_valid = True
        elif isinstance(metadata['colors'], str) and metadata['colors'].strip():
            colors_valid = True
    
    if not colors_valid:
        missing_fields.append('colors')
    
    if missing_fields:
        logger.warning(f"Metadata validation failed. Missing fields: {', '.join(missing_fields)}")
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    
    logger.info("Metadata validation passed")
    return True, ""

# ---------------------------------
# Firebase Storage Functions
# ---------------------------------
def upload_bytes_to_firebase(img_bytes, user_id, profile_id, image_id, filename, metadata=None):
    """Upload image bytes directly to Firebase Cloud Storage with proper folder structure."""
    if not firebase_ready:
        logger.error("Attempted upload to Firebase when Firebase is not ready")
        raise RuntimeError("Firebase Storage is not available")
    
    try:
        logger.info(f"Starting Firebase upload: user={user_id}, profile={profile_id}, image={image_id}")
        
        # Create safe filename
        safe_filename = secure_filename(f"{image_id}_{filename}")
        
        # Get category and subcategory from metadata
        category = metadata.get('category', 'uncategorized')
        sub_category = metadata.get('sub_category', 'other')
        
        # Create the storage path with the new structure
        storage_path = f"wardrobe/{user_id}/{profile_id}/{category}/{sub_category}/{safe_filename}"
        logger.info(f"Storage path: {storage_path}")
        
        # Create blob and upload bytes
        blob = bucket.blob(storage_path)
        
        # Add metadata
        if metadata is None:
            metadata = {}
        metadata.update({
            'user_id': user_id,
            'profile_id': profile_id,
            'image_id': image_id,
            'upload_timestamp': datetime.datetime.now().isoformat()
        })
        blob.metadata = metadata
        
        # Upload the bytes directly
        logger.info(f"Uploading bytes to Firebase (size: {len(img_bytes)} bytes)")
        blob.upload_from_string(img_bytes, content_type='image/png')
        logger.info(f"File uploaded to Firebase: {storage_path}")
        
        # Generate download URL
        image_url = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{storage_path.replace('/', '%2F')}?alt=media"
        logger.info(f"Generated image URL: {image_url}")
        return image_url, storage_path
        
    except Exception as e:
        logger.error(f"Firebase upload failed: {str(e)}", exc_info=True)
        raise

def save_to_firestore(item_data):
    """Save item data to Firestore."""
    if not firebase_ready:
        logger.error("Attempted to save to Firestore when Firebase is not ready")
        raise RuntimeError("Firestore is not available")
    
    try:
        # Add timestamp
        item_data['upload_timestamp'] = firestore.SERVER_TIMESTAMP
        
        # Save to Firestore
        doc_ref = db.collection(FIRESTORE_COLLECTION).document(item_data['image_id'])
        logger.info(f"Saving to Firestore collection '{FIRESTORE_COLLECTION}', document ID: {item_data['image_id']}")
        logger.info(f"Firestore data: {json.dumps({k: str(v) for k, v in item_data.items()})}")
        
        doc_ref.set(item_data)
        logger.info(f"Data saved to Firestore: {item_data['image_id']}")
        return True
    except Exception as e:
        logger.error(f"Firestore save failed: {str(e)}", exc_info=True)
        raise

# ---------------------------------
# Socket Event Handlers
# ---------------------------------
@socketio.on('process_image')
def handle_process_image(data):
    """
    Process image, remove background and return preview.
    All processing is done in memory without local file storage.
    """
    image_id = str(uuid.uuid4())
    
    try:
        # Immediately acknowledge receipt of image
        emit('image_received', {'status': 'Image received, processing started'})
        logger.info(f"Image received for processing, generated image_id: {image_id}")
        
        if not data.get('image') or not data.get('filename'):
            emit('process_error', {'error': 'Missing image or filename'})
            logger.error("Missing image or filename in process_image request")
            return

        # Decode base64 image to bytes
        original_bytes = decode_base64_to_bytes(data['image'])
        if original_bytes is None:
            emit('process_error', {'error': 'Failed to decode image'})
            return

        # Process image (remove background) - all in memory
        processed_bytes = remove_background_from_bytes(original_bytes)
        if processed_bytes is None:
            emit('process_error', {'error': 'Background removal failed'})
            return

        # Convert processed bytes to base64 for preview
        processed_b64 = base64.b64encode(processed_bytes).decode('utf-8')

        emit('process_success', {
            'processed_image': processed_b64,
            'image_id': image_id,
            'status': 'Background removed successfully'
        })
        logger.info(f"Image processing successful for image_id: {image_id}")

    except Exception as e:
        logger.error(f"Image processing error: {e}", exc_info=True)
        emit('process_error', {'error': str(e)})

@socketio.on('update_item')
def handle_update_item(data):
    try:
        emit('upload_started', {'status': 'Update data received, starting update process'})
        logger.info(f"Update item request received for item_id: {data.get('item_id', 'unknown')}")

        # Validate required fields
        required_fields = ['item_id', 'metadata', 'user_id', 'profile_id', 'image_id']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            logger.error(error_msg)
            emit('upload_error', {'error': error_msg})
            return

        if not firebase_ready:
            emit('upload_error', {'error': 'Firebase services are not available'})
            return

        item_id = data['item_id']
        user_id = data['user_id']
        profile_id = data['profile_id']
        image_id = data['image_id']
        new_processed_image = data.get('processed_image')
        filename = data.get('filename', 'item.jpg')

        # Normalize and validate metadata
        metadata = normalize_metadata(data['metadata'])
        is_valid, error_msg = validate_metadata(metadata)
        if not is_valid:
            emit('upload_error', {'error': error_msg})
            return

        new_category = metadata.get('category', '')
        new_subcategory = metadata.get('sub_category', '')

        # Fetch existing item from Firestore
        doc_ref = db.collection(FIRESTORE_COLLECTION).document(item_id)
        existing_item = doc_ref.get().to_dict()
        if not existing_item:
            emit('upload_error', {'error': 'Item not found'})
            return

        # Verify ownership
        if existing_item['user_id'] != user_id or existing_item['profile_id'] != profile_id:
            emit('upload_error', {'error': 'Unauthorized to update this item'})
            return

        # Determine path changes
        old_category = existing_item.get('category', '')
        old_subcategory = existing_item.get('sub_category', '')
        category_changed = old_category != new_category
        subcategory_changed = old_subcategory != new_subcategory
        path_changed = category_changed or subcategory_changed

        # Handle image changes
        new_image_id = image_id
        new_image_url = existing_item['image_url']
        new_storage_path = existing_item['storage_path']

        if new_processed_image:
            # Process new image upload - decode base64 to bytes
            processed_bytes = decode_base64_to_bytes(new_processed_image)
            if processed_bytes is None:
                emit('upload_error', {'error': 'Failed to decode new image'})
                return

            # Upload bytes directly to Firebase Storage
            new_image_id = str(uuid.uuid4())
            storage_metadata = {
                'category': new_category,
                'sub_category': new_subcategory,
                'brand': metadata.get('brand', ''),
                'size': metadata.get('size', ''),
                'washing_conditions': metadata.get('washing_conditions', ''),
                'colors': ','.join(metadata['colors']) if isinstance(metadata.get('colors'), list) else ''
            }
            
            try:
                new_image_url, new_storage_path = upload_bytes_to_firebase(
                    processed_bytes,
                    user_id,
                    profile_id,
                    new_image_id,
                    filename,
                    metadata=storage_metadata
                )
            except Exception as e:
                logger.error(f"New image upload failed: {str(e)}")
                emit('upload_error', {'error': f"Image upload failed: {str(e)}"})
                return

            # Delete old image from Storage
            try:
                old_blob = bucket.blob(existing_item['storage_path'])
                old_blob.delete()
                logger.info(f"Deleted old image: {existing_item['storage_path']}")
            except Exception as e:
                logger.error(f"Error deleting old image: {str(e)}")

        elif path_changed:
            # Move existing image to new path
            existing_filename = os.path.basename(existing_item['storage_path'])
            new_storage_path = f"wardrobe/{user_id}/{profile_id}/{new_category}/{new_subcategory}/{existing_filename}"
            
            try:
                old_blob = bucket.blob(existing_item['storage_path'])
                new_blob = bucket.copy_blob(old_blob, bucket, new_storage_path)
                new_blob.reload()
                new_image_url = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{new_storage_path.replace('/', '%2F')}?alt=media"
                old_blob.delete()
                logger.info(f"Moved image to new path: {new_storage_path}")
            except Exception as e:
                logger.error(f"Error moving image: {str(e)}")
                emit('upload_error', {'error': f"Failed to update storage location: {str(e)}"})
                return

        # Update Firestore document
        updated_data = {
            'category': new_category,
            'sub_category': new_subcategory,
            'brand': metadata.get('brand', existing_item.get('brand', '')),
            'size': metadata.get('size', existing_item.get('size', '')),
            'colors': metadata.get('colors', existing_item.get('colors', [])),
            'washing_conditions': metadata.get('washing_conditions', existing_item.get('washing_conditions', '')),
            'image_url': new_image_url,
            'storage_path': new_storage_path,
            'image_id': new_image_id,
            'updated_timestamp': firestore.SERVER_TIMESTAMP
        }

        # Remove None values
        updated_data = {k: v for k, v in updated_data.items() if v is not None}

        doc_ref.update(updated_data)
        logger.info(f"Successfully updated Firestore document: {item_id}")

        emit('upload_success', {
            'item_id': item_id,
            'image_url': new_image_url,
            'message': 'Item updated successfully'
        })

    except Exception as e:
        logger.error(f"Update failed: {str(e)}", exc_info=True)
        emit('upload_error', {'error': f"Update failed: {str(e)}"})

@socketio.on('finalize_upload')
def handle_final_upload(data):
    """
    Save processed image to Firebase Storage and metadata to Firestore.
    All processing is done in memory without local file storage.
    """
    try:
        # Immediately acknowledge receipt of data
        emit('upload_started', {'status': 'Upload data received, starting upload process'})
        logger.info(f"Finalize upload request received with image_id: {data.get('image_id', 'unknown')}")
        
        # Validate required fields
        required_fields = ['processed_image', 'filename', 'metadata', 'image_id']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            logger.error(error_msg)
            emit('upload_error', {'error': error_msg})
            return
            
        # Make sure Firebase is available
        if not firebase_ready:
            emit('upload_error', {'error': 'Firebase services are not available'})
            logger.error("Firebase services not available for upload")
            return
            
        # Get basic information
        image_id = data['image_id']
        sanitized_filename = secure_filename(data['filename'])
        logger.info(f"Processing upload for image_id: {image_id}, filename: {sanitized_filename}")
        
        # Get and normalize metadata
        metadata = normalize_metadata(data['metadata'])
        
        # Extract user_id either from top level or metadata
        user_id = data.get('user_id') or metadata.get('user_id')
        if not user_id:
            logger.error("No user_id found in request data or metadata")
            emit('upload_error', {'error': 'No user_id found in request data or metadata'})
            return
            
        # Get profile_id from metadata
        profile_id = metadata.get('profile_id')
        if not profile_id:
            logger.error("No profile_id found in metadata")
            emit('upload_error', {'error': 'No profile_id found in metadata'})
            return
        
        # Validate metadata
        is_valid, error_msg = validate_metadata(metadata)
        if not is_valid:
            emit('upload_error', {'error': error_msg})
            return
        
        # Convert base64 processed image to bytes
        processed_bytes = decode_base64_to_bytes(data['processed_image'])
        if processed_bytes is None:
            logger.error("Failed to decode processed image")
            emit('upload_error', {'error': 'Failed to decode processed image'})
            return
        
        # Create storage metadata
        storage_metadata = {
            'category': metadata.get('category', ''),
            'sub_category': metadata.get('sub_category', ''),
            'brand': metadata.get('brand', ''),
            'size': metadata.get('size', ''),
            'washing_conditions': metadata.get('washing_conditions', ''),
            'colors': ','.join(metadata['colors']) if isinstance(metadata.get('colors'), list) else ''
        }
        
        try:
            logger.info(f"Starting upload to Firebase Storage for image_id: {image_id}")
            processed_url, storage_path = upload_bytes_to_firebase(
                processed_bytes,
                user_id,
                profile_id,
                image_id,
                sanitized_filename,
                metadata=storage_metadata
            )
            logger.info(f"Upload successful: {storage_path}")
        except Exception as upload_error:
            logger.error(f"Firebase storage error: {str(upload_error)}")
            emit('upload_error', {'error': f"Firebase storage error: {str(upload_error)}"})
            return

        # Prepare final metadata for Firestore
        final_metadata = {
            'image_id': image_id,
            'user_id': user_id,
            'profile_id': profile_id,
            'category': metadata.get('category', ''),
            'sub_category': metadata.get('sub_category', ''),
            'brand': metadata.get('brand', ''),
            'size': metadata.get('size', ''),
            'colors': metadata.get('colors', []),
            'washing_conditions': metadata.get('washing_conditions', ''),
            'image_url': processed_url,
            'storage_path': storage_path
        }

        # Save to Firestore
        try:
            logger.info(f"Saving to Firestore with ID: {image_id}")
            save_to_firestore(final_metadata)
            logger.info(f"Firestore save successful")
        except Exception as firestore_error:
            logger.error(f"Firestore error: {str(firestore_error)}")
            emit('upload_error', {'error': f"Firestore error: {str(firestore_error)}"})
            return

        # Return success to client
        emit('upload_success', {
            'image_id': image_id,
            'image_url': processed_url,
            'user_id': user_id,
            'profile_id': profile_id,
            'message': 'Upload completed successfully'
        })
        logger.info(f"Upload process completed successfully for image_id: {image_id}")

    except Exception as e:
        logger.error(f"Final upload error: {str(e)}", exc_info=True)
        emit('upload_error', {'error': f"Upload processing error: {str(e)}"})

# ---------------------------------
# Connection Event Handlers
# ---------------------------------
@socketio.on('socket_health_check')
def handle_socket_health_check():
    """
    Simple health check for socket.io connection.
    """
    logger.info(f"Socket health check from client: {request.sid}")
    emit('socket_health_response', {
        'status': 'healthy',
        'session_id': request.sid,
        'timestamp': datetime.datetime.now().isoformat(),
        'firebase_ready': firebase_ready
    })

@socketio.on('connect')
def handle_connect():
    logger.info(f"Client connected: {request.sid}")
    emit('connect_response', {
        'status': 'Connected to Digital Wardrobe backend',
        'session_id': request.sid,
        'firebase_ready': firebase_ready,
        'server_timestamp': datetime.datetime.now().isoformat()
    })

@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f"Client disconnected: {request.sid}")

# ---------------------------------
# HTTP Endpoints - Original Wardrobe
# ---------------------------------
@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    status = {
        "status": "OK",
        "firebase_ready": firebase_ready,
        "firebase_storage_bucket": FIREBASE_STORAGE_BUCKET if firebase_ready else None,
        "firestore_collection": FIRESTORE_COLLECTION if firebase_ready else None,
        "timestamp": datetime.datetime.now().isoformat()
    }
    logger.info(f"Health check: {json.dumps(status)}")
    return jsonify(status), 200

@app.route('/wardrobe/<profile_id>', methods=['GET'])
def get_items(profile_id):
    """Get all wardrobe items for a profile."""
    try:
        if not firebase_ready:
            return jsonify({"error": "Firebase services not available"}), 503
            
        items_ref = db.collection(FIRESTORE_COLLECTION).where("profile_id", "==", profile_id)
        items = [doc.to_dict() for doc in items_ref.stream()]
        return jsonify({"items": items})
    except Exception as e:
        logger.error(f"Error retrieving wardrobe items: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ---------------------------------
# HTTP Endpoints - Profile Management
# ---------------------------------
@app.route('/api/health', methods=['GET'])
def api_health_check():
    """Health check route for API endpoints."""
    return jsonify({"status": "ok", "message": "Smart Mirror API is running"})

@app.route('/api/profile', methods=['POST'])
def save_profile():
    """Save profile JSON."""
    try:
        profile_data = request.get_json()
        if not profile_data:
            return jsonify({"error": "No profile data provided"}), 400
        
        profiles = load_profiles()
        profile_id = str(uuid.uuid4())
        profile_data["id"] = profile_id
        profiles.append(profile_data)
        save_profiles(profiles)
        
        return jsonify({"success": True, "id": profile_id, "message": "Profile saved successfully"})
    except Exception as e:
        logger.error(f"Error saving profile: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/profiles', methods=['GET'])
def get_profiles():
    """Get all profiles."""
    try:
        return jsonify({"profiles": load_profiles()})
    except Exception as e:
        logger.error(f"Error retrieving profiles: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/profile/<profile_id>', methods=['GET'])
def get_profile(profile_id):
    """Get one profile."""
    try:
        profiles = load_profiles()
        for profile in profiles:
            if profile.get("id") == profile_id:
                return jsonify(profile)
        return jsonify({"error": "Profile not found"}), 404
    except Exception as e:
        logger.error(f"Error retrieving profile: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/upload-face', methods=['POST'])
def upload_face():
    """Upload ZIP of face images, extract, and generate embeddings."""
    try:
        profile_id = request.form.get('profile_id')
        if not profile_id:
            return jsonify({"error": "Profile ID is required"}), 400
            
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Verify profile exists
        profiles = load_profiles()
        profile = next((p for p in profiles if p["id"] == profile_id), None)
        if not profile:
            return jsonify({"error": "Profile not found"}), 404

        # Prepare directory
        profile_folder = os.path.join(FACE_DATA_DIR, profile_id)
        os.makedirs(profile_folder, exist_ok=True)

        # Save ZIP file temporarily
        zip_path = os.path.join(profile_folder, "faces.zip")
        file.save(zip_path)

        # Extract images
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(profile_folder)

        # Recursively find all image files in the extracted folder
        image_files = []
        for root, _, files in os.walk(profile_folder):
            for f in files:
                if f.lower().endswith((".jpg", ".jpeg", ".png")):
                    image_files.append(os.path.join(root, f))

        if not image_files:
            return jsonify({"error": "No valid images found in ZIP"}), 400

        embeddings = []
        sample_image = None

        for img_path in image_files:
            image = face_recognition.load_image_file(img_path)
            encodings = face_recognition.face_encodings(image)

            if encodings:
                embedding = encodings[0]
                emb_path = os.path.splitext(img_path)[0] + ".npy"
                np.save(emb_path, embedding)
                embeddings.append(embedding)

                if not sample_image:
                    sample_image = img_path  # Save first successful image

        if not embeddings:
            return jsonify({"error": "No faces found in the uploaded images"}), 400

        # Update the profile with face data
        for profile in profiles:
            if profile["id"] == profile_id:
                # Only set facePhoto if not already set
                if not profile.get("facePhoto"):
                    profile["facePhoto"] = sample_image
                break

        save_profiles(profiles)

        # Clean up ZIP file
        os.remove(zip_path)

        return jsonify({
            "success": True,
            "message": f"{len(embeddings)} face(s) processed",
            "sample_image": sample_image
        })

    except Exception as e:
        # Clean up ZIP file if it exists
        if 'zip_path' in locals() and os.path.exists(zip_path):
            os.remove(zip_path)
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# ---------------------------------
# Face Recognition Endpoints
# ---------------------------------
@app.route('/api/recognize-face', methods=['POST'])
def recognize_face():
    """Recognize face from uploaded image against stored embeddings."""
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded"}), 400
            
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No image selected"}), 400

        # Load image and extract face encodings
        image = face_recognition.load_image_file(file)
        face_encodings = face_recognition.face_encodings(image)
        
        if not face_encodings:
            return jsonify({"error": "No face found in the uploaded image"}), 400

        uploaded_encoding = face_encodings[0]
        
        # Load all profiles and check for matches
        profiles = load_profiles()
        matches = []
        
        for profile in profiles:
            profile_id = profile["id"]
            profile_folder = os.path.join(FACE_DATA_DIR, profile_id)
            
            if not os.path.exists(profile_folder):
                continue
                
            # Load all embeddings for this profile
            for root, _, files in os.walk(profile_folder):
                for f in files:
                    if f.endswith('.npy'):
                        emb_path = os.path.join(root, f)
                        try:
                            stored_encoding = np.load(emb_path)
                            
                            # Compare faces
                            results = face_recognition.compare_faces([stored_encoding], uploaded_encoding, tolerance=0.6)
                            distance = face_recognition.face_distance([stored_encoding], uploaded_encoding)[0]
                            
                            if results[0]:
                                matches.append({
                                    "profile_id": profile_id,
                                    "profile_name": profile.get("name", "Unknown"),
                                    "confidence": float(1 - distance),
                                    "distance": float(distance)
                                })
                                break  # Found a match for this profile, no need to check other embeddings
                        except Exception as e:
                            logger.error(f"Error loading embedding {emb_path}: {str(e)}")
                            continue
        
        # Sort matches by confidence (highest first)
        matches.sort(key=lambda x: x["confidence"], reverse=True)
        
        if matches:
            best_match = matches[0]
            return jsonify({
                "success": True,
                "recognized": True,
                "profile_id": best_match["profile_id"],
                "profile_name": best_match["profile_name"],
                "confidence": best_match["confidence"],
                "all_matches": matches
            })
        else:
            return jsonify({
                "success": True,
                "recognized": False,
                "message": "No matching profile found"
            })
            
    except Exception as e:
        logger.error(f"Face recognition error: {str(e)}", exc_info=True)
        return jsonify({"error": f"Face recognition failed: {str(e)}"}), 500

@app.route('/api/profile/<profile_id>/face-data', methods=['DELETE'])
def delete_face_data(profile_id):
    """Delete face data for a specific profile."""
    try:
        profiles = load_profiles()
        profile = next((p for p in profiles if p["id"] == profile_id), None)
        if not profile:
            return jsonify({"error": "Profile not found"}), 404

        profile_folder = os.path.join(FACE_DATA_DIR, profile_id)
        
        if os.path.exists(profile_folder):
            shutil.rmtree(profile_folder)
            logger.info(f"Deleted face data folder: {profile_folder}")
        
        # Update profile to remove facePhoto reference
        for profile in profiles:
            if profile["id"] == profile_id:
                profile.pop("facePhoto", None)
                break
        
        save_profiles(profiles)
        
        return jsonify({
            "success": True,
            "message": "Face data deleted successfully"
        })
        
    except Exception as e:
        logger.error(f"Error deleting face data: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to delete face data: {str(e)}"}), 500

# ---------------------------------
# Wardrobe Item Management Endpoints
# ---------------------------------
@app.route('/api/wardrobe/<profile_id>/items', methods=['GET'])
def get_wardrobe_items(profile_id):
    """Get all wardrobe items for a specific profile."""
    try:
        if not firebase_ready:
            return jsonify({"error": "Firebase services not available"}), 503
            
        # Get query parameters for filtering
        category = request.args.get('category')
        sub_category = request.args.get('sub_category')
        
        # Build query
        query = db.collection(FIRESTORE_COLLECTION).where("profile_id", "==", profile_id)
        
        if category:
            query = query.where("category", "==", category)
        if sub_category:
            query = query.where("sub_category", "==", sub_category)
            
        items = []
        for doc in query.stream():
            item = doc.to_dict()
            item['id'] = doc.id  # Include document ID
            items.append(item)
            
        return jsonify({
            "success": True,
            "items": items,
            "count": len(items)
        })
        
    except Exception as e:
        logger.error(f"Error retrieving wardrobe items: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to retrieve items: {str(e)}"}), 500

@app.route('/api/wardrobe/item/<item_id>', methods=['DELETE'])
def delete_wardrobe_item(item_id):
    """Delete a specific wardrobe item."""
    try:
        if not firebase_ready:
            return jsonify({"error": "Firebase services not available"}), 503
            
        # Get the item first to retrieve storage path
        doc_ref = db.collection(FIRESTORE_COLLECTION).document(item_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({"error": "Item not found"}), 404
            
        item_data = doc.to_dict()
        
        # Delete from Firebase Storage
        if 'storage_path' in item_data:
            try:
                blob = bucket.blob(item_data['storage_path'])
                blob.delete()
                logger.info(f"Deleted image from storage: {item_data['storage_path']}")
            except Exception as e:
                logger.warning(f"Could not delete image from storage: {str(e)}")
        
        # Delete from Firestore
        doc_ref.delete()
        logger.info(f"Deleted item from Firestore: {item_id}")
        
        return jsonify({
            "success": True,
            "message": "Item deleted successfully"
        })
        
    except Exception as e:
        logger.error(f"Error deleting item: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to delete item: {str(e)}"}), 500

# ---------------------------------
# Error Handlers
# ---------------------------------
@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error."""
    return jsonify({
        "error": "File too large",
        "message": f"Maximum file size is {MAX_UPLOAD_SIZE // (1024*1024)}MB"
    }), 413

@app.errorhandler(500)
def internal_server_error(error):
    """Handle internal server errors."""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        "error": "Internal server error",
        "message": "An unexpected error occurred"
    }), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        "error": "Not found",
        "message": "The requested resource was not found"
    }), 404

# ---------------------------------
# Cleanup and Shutdown Handlers
# ---------------------------------
import atexit
import signal

def cleanup_on_exit():
    """Cleanup function to run on application exit."""
    logger.info("Application shutting down, performing cleanup...")
    
    # Close Firebase connections gracefully
    try:
        if firebase_ready and firebase_admin._apps:
            firebase_admin.delete_app(firebase_admin.get_app())
            logger.info("Firebase app deleted successfully")
    except Exception as e:
        logger.error(f"Error during Firebase cleanup: {str(e)}")

def signal_handler(signum, frame):
    """Handle shutdown signals."""
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    cleanup_on_exit()
    sys.exit(0)

# Register cleanup handlers
atexit.register(cleanup_on_exit)
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# ---------------------------------
# Application Entry Point
# ---------------------------------
if __name__ == '__main__':
    try:
        # Log startup information
        logger.info("=" * 60)
        logger.info("DIGITAL WARDROBE APPLICATION STARTING")
        logger.info("=" * 60)
        logger.info(f"Firebase Ready: {firebase_ready}")
        logger.info(f"Storage Bucket: {FIREBASE_STORAGE_BUCKET}")
        logger.info(f"Firestore Collection: {FIRESTORE_COLLECTION}")
        logger.info(f"Max Upload Size: {MAX_UPLOAD_SIZE // (1024*1024)}MB")
        logger.info(f"Face Data Directory: {FACE_DATA_DIR}")
        logger.info(f"Profile File: {PROFILE_FILE}")
        logger.info("=" * 60)
        
        # Get configuration from environment variables
        host = os.getenv('HOST', '0.0.0.0')
        port = int(os.getenv('PORT', 5000))
        debug = os.getenv('DEBUG', 'False').lower() in ('true', '1', 'yes', 'on')
        
        logger.info(f"Starting server on {host}:{port} (debug={debug})")
        
        # Start the application
        socketio.run(
            app,
            host=host,
            port=port,
            debug=debug,
            allow_unsafe_werkzeug=True  # Required for SocketIO in development
        )
        
    except KeyboardInterrupt:
        logger.info("Application interrupted by user")
    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}", exc_info=True)
        sys.exit(1)
    finally:
        logger.info("Digital Wardrobe application stopped")