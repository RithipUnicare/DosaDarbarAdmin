import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProducts,
  selectAllProducts,
  getProductsStatus,
  getProductsError,
} from './redux/slices/productSlice';

export default function Home() {
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts);
  const status = useSelector(getProductsStatus);
  const error = useSelector(getProductsError);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchProducts());
    }
  }, [status, dispatch]);

  let content;
  if (status === 'loading') {
    content = <div>Loading...</div>;
  } else if (status === 'succeeded') {
    content = (
      <div>
        <h2>Products</h2>
        {products.map(product => (
          <div key={product.id}>
            <h3>{product.name}</h3>
            <p>Price: {product.price}</p>
            {/* Add more product details as needed */}
          </div>
        ))}
      </div>
    );
  } else if (status === 'failed') {
    content = <div>{error}</div>;
  }

  return <main>{content}</main>;
}
