const mongoose = require('mongoose');

const labourProfileSchema = new mongoose.Schema(
  {
    labour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      required: true,
      unique: true,
      index: true,
    },
    // Optional profile picture (can be a URL or data URL)
    profilePicture: {
      type: String,
      default: '',
      trim: true,
    },
    // We mirror phone here for convenience/history of profile page edits
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    // Location information
    location: {
      address: {
        type: String,
        default: '',
        trim: true,
        maxlength: [200, 'Address cannot exceed 200 characters']
      },
      city: {
        type: String,
        default: '',
        trim: true,
        maxlength: [50, 'City cannot exceed 50 characters']
      },
      state: {
        type: String,
        default: '',
        trim: true,
        maxlength: [50, 'State cannot exceed 50 characters']
      },
      country: {
        type: String,
        default: '',
        trim: true,
        maxlength: [50, 'Country cannot exceed 50 characters']
      },
      pincode: {
        type: String,
        default: '',
        trim: true,
        validate: {
          validator: function(v) {
            return !v || /^[0-9]{4,10}$/.test(v);
          },
          message: 'Pincode must be 4-10 digits'
        }
      },
      zipcode: {
        type: String,
        default: '',
        trim: true,
        validate: {
          validator: function(v) {
            return !v || /^[A-Za-z0-9\s\-]{3,10}$/.test(v);
          },
          message: 'Zipcode must be 3-10 alphanumeric characters'
        }
      }
    },
  },
  { timestamps: true, collection: 'labour-profile' }
);

module.exports = mongoose.model('LabourProfile', labourProfileSchema);