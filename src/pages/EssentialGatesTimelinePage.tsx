import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

export default function EssentialGatesTimelinePage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    if (productId) {
      const returnTo = searchParams.get('returnTo');
      // Redirect to milestones page, preserving returnTo param and opening dates dialog
      const queryString = returnTo ? `?returnTo=${returnTo}&openDates=true` : '?openDates=true';
      navigate(`/app/product/${productId}/milestones${queryString}`, { replace: true });
    }
  }, [productId, navigate, searchParams]);

  return null;
}
