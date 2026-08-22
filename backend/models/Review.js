import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please add a rating between 1 and 5'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Please add a review comment'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from submitting more than one review per project
reviewSchema.index({ project: 1, user: 1 }, { unique: true });

// Static method to get average rating of a project
reviewSchema.statics.getAverageRating = async function (projectId) {
  const obj = await this.aggregate([
    {
      $match: { project: projectId },
    },
    {
      $group: {
        _id: '$project',
        averageRating: { $avg: '$rating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  try {
    if (obj.length > 0) {
      await this.model('Project').findByIdAndUpdate(projectId, {
        'ratings.average': Math.round(obj[0].averageRating * 10) / 10,
        'ratings.count': obj[0].ratingCount,
      });
    } else {
      await this.model('Project').findByIdAndUpdate(projectId, {
        'ratings.average': 0,
        'ratings.count': 0,
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
reviewSchema.post('save', async function () {
  await this.constructor.getAverageRating(this.project);
});

// Call getAverageRating before delete
reviewSchema.pre('deleteOne', { document: true, query: false }, async function () {
  await this.constructor.getAverageRating(this.project);
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
