async function loadReviews(productId) {
  if (!productId) {
    console.warn('No productId provided for loadReviews');
    return;
  }
  try {
    const res = await fetch(`/api/reviews/${productId}`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    
    const reviews = await res.json();
    const container = document.getElementById('reviewsList');
    
    if (!container) return;

    if (reviews.length === 0) {
      container.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to review!</p>';
      return;
    }

    renderReviews(container, reviews);
  } catch (err) {
    console.error('Error loading reviews:', err);
  }
}
