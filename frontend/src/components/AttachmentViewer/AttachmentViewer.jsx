import React, { useState } from 'react';
import './AttachmentViewer.css';

const AttachmentViewer = ({ attachments, compact = false }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const isImage = (filename) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const extension = filename.split('.').pop().toLowerCase();
    return imageExtensions.includes(extension);
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className={`attachment-viewer ${compact ? 'compact' : ''}`}>
        <div className="attachment-header">
          <h4 className="attachment-title">📎 Supporting Files ({attachments.length})</h4>
        </div>
        
        <div className={`attachment-grid ${compact ? 'grid-compact' : 'grid-full'}`}>
          {attachments.map((attachment, index) => (
            <div key={index} className="attachment-item">
              <div className="attachment-preview">
                {isImage(attachment.filename) ? (
                  <div className="image-preview">
                    <img 
                      src={attachment.url} 
                      alt={attachment.filename}
                      onClick={() => setSelectedImage(attachment)}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="image-error" style={{ display: 'none' }}>
                      <span className="error-icon">🖼️</span>
                      <span className="error-text">Image unavailable</span>
                    </div>
                    <div className="image-overlay">
                      <button 
                        className="view-btn"
                        onClick={() => setSelectedImage(attachment)}
                        title="View full size"
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="file-icon-preview">
                    <span className="file-icon">{getFileIcon(attachment.filename)}</span>
                  </div>
                )}
              </div>
              
              <div className="attachment-info">
                <div className="filename" title={attachment.filename}>
                  {attachment.filename.length > 20 && compact 
                    ? `${attachment.filename.substring(0, 17)}...` 
                    : attachment.filename
                  }
                </div>
                
                <div className="attachment-actions">
                  <button
                    className="action-btn view-btn"
                    onClick={() => window.open(attachment.url, '_blank')}
                    title="Open in new tab"
                  >
                    👁️ View
                  </button>
                  <button
                    className="action-btn download-btn"
                    onClick={() => handleDownload(attachment.url, attachment.filename)}
                    title="Download file"
                  >
                    ⬇️ Download
                  </button>
                </div>
                
                {!compact && attachment.uploadedAt && (
                  <div className="upload-date">
                    Uploaded: {new Date(attachment.uploadedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3>{selectedImage.filename}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedImage(null)}
              >
                ✕
              </button>
            </div>
            <div className="image-modal-body">
              <img src={selectedImage.url} alt={selectedImage.filename} />
            </div>
            <div className="image-modal-footer">
              <button
                className="modal-action-btn"
                onClick={() => window.open(selectedImage.url, '_blank')}
              >
                🔗 Open Original
              </button>
              <button
                className="modal-action-btn"
                onClick={() => handleDownload(selectedImage.url, selectedImage.filename)}
              >
                ⬇️ Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttachmentViewer;