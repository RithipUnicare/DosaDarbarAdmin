import { BASE_URL, endPoints } from './Configuration';
import { Alert } from 'react-native';

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

// Existing card operations
export const addCard = async data => {
  try {
    const response = await fetch(endPoints.addCard, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const responseData = await response.json();
    return { ok: response.ok, data: responseData };
  } catch (error) {
    console.error('Add card error:', error);
    Alert.alert('Error', 'Failed to add card');
    return { ok: false, error };
  }
};

export const updateCard = async data => {
  try {
    const response = await fetch(endPoints.updateCard, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const responseData = await response.json();
    return { ok: response.ok, data: responseData };
  } catch (error) {
    console.error('Update card error:', error);
    Alert.alert('Error', 'Failed to update card');
    return { ok: false, error };
  }
};

export const deleteCard = async id => {
  try {
    console.log('Deleting card with id:', endPoints.deleteCard(id));
    const response = await fetch(endPoints.deleteCard(id), {
      method: 'GET',
      headers: getHeaders(),
    });
    const responseData = await response.json();
    console.log(responseData);
    return { ok: response.ok, data: responseData };
  } catch (error) {
    //console.error('Delete card error:', error);
    Alert.alert('Error', 'Failed to delete card');
    return { ok: false, error };
  }
};

// Report APIs
export const getCategoryWiseReport = async (categoryId, fromDate, toDate) => {
  try {
    const response = await fetch(endPoints.categoryWiseReport, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        category: categoryId,
        from_date: fromDate,
        to_date: toDate,
      }),
    });
    const responseData = await response.json();
    return { ok: response.ok, data: responseData };
  } catch (error) {
    console.error('Category wise report error:', error);
    Alert.alert('Error', 'Failed to fetch category wise report');
    return { ok: false, error };
  }
};

export const getItemWiseReport = async (
  categoryId,
  itemId,
  fromDate,
  toDate,
) => {
  try {
    const response = await fetch(endPoints.itemWiseReport, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        category: categoryId,
        item: itemId,
        from_date: fromDate,
        to_date: toDate,
      }),
    });
    const responseData = await response.json();
    return { ok: response.ok, data: responseData };
  } catch (error) {
    console.error('Item wise report error:', error);
    Alert.alert('Error', 'Failed to fetch item wise report');
    return { ok: false, error };
  }
};

export const getBillWiseReport = async (
  billNo,
  paymentMode,
  fromDate,
  toDate,
) => {
  try {
    const response = await fetch(endPoints.billWiseReport, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        bill_no: billNo,
        pmode: paymentMode || 'all',
        from_date: fromDate,
        to_date: toDate,
      }),
    });
    const responseData = await response.json();
    return { ok: response.ok, data: responseData };
  } catch (error) {
    console.error('Bill wise report error:', error);
    Alert.alert('Error', 'Failed to fetch bill wise report');
    return { ok: false, error };
  }
};

export const getAllOrders = async () => {
  try {
    const response = await fetch(endPoints.allOrders, {
      method: 'GET',
      headers: getHeaders(),
    });
    const responseData = await response.json();
    console.log(responseData);
    return { ok: response.ok, data: responseData };
  } catch (error) {
    console.error('Get all orders error:', error);
    Alert.alert('Error', 'Failed to fetch all orders');
    return { ok: false, error };
  }
};

export const submitBill = async billData => {
  try {
    const response = await fetch(endPoints.submitBill, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(billData),
    });
    const responseData = await response.json();
    console.log(responseData);
    return { ok: response.ok, data: responseData };
  } catch (error) {
    //console.error('Submit bill error:', error);
    Alert.alert('Error', 'Failed to submit bill');
    return { ok: false, error };
  }
};

export const getAllProducts = async () => {
  try {
    const response = await fetch(endPoints.getAllProducts, {
      method: 'GET',
      headers: getHeaders(),
    });
    const responseData = await response.json();
    console.log(responseData);
    return { ok: response.ok, data: responseData };
  } catch (error) {
    console.error('Get all products error:', error);
    Alert.alert('Error', 'Failed to fetch all products');
    return { ok: false, error };
  }
};

export const getOrder = async userId => {
  try {
    const response = await fetch(endPoints.getOrder(userId), {
      method: 'GET',
      headers: getHeaders(),
    });
    const responseData = await response.json();
    console.log(responseData);
    return { ok: response.ok, data: responseData };
  } catch (error) {
    console.error('Get order error:', error);
    Alert.alert('Error', 'Failed to fetch order');
    return { ok: false, error };
  }
};

export const addOrder = async (table_no, total_amount, instruction) => {
  try {
    console.log(endPoints.addOrder(table_no, total_amount, instruction));
    const response = await fetch(
      endPoints.addOrder(table_no, total_amount, instruction),
      {
        method: 'GET',
        headers: getHeaders(),
      },
    );
    const responseData = await response.json();
    console.log(responseData);
    return { ok: response.ok, data: responseData };
  } catch (error) {
    console.error('Add order error:', error);
    Alert.alert('Error', 'Failed to add order');
    return { ok: false, error };
  }
};
