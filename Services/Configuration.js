export const BASE_URL = 'http://unitech.agency/Dosadharbar/api/v1';

export const endPoints = {
  // Cart operations
  addCard: `${BASE_URL}/add_product_cartAdmin`,
  updateCard: `${BASE_URL}/add_product_cartAdmin`,
  deleteCard: id => `${BASE_URL}/delete_CartProduct/${id}`,
  getCart: `${BASE_URL}/get_cart_detailsAdmin`,

  // Report endpoints
  categoryWiseReport: `${BASE_URL}/category_WiseReport`,
  itemWiseReport: `${BASE_URL}/item_WiseReport`,
  billWiseReport: `${BASE_URL}/bill_WiseReport`,
  allOrders: `${BASE_URL}/AllOrders`,

  // Bill submission
  submitBill: `${BASE_URL}/bill_WiseReport`,

  //getAllProducts

  getAllProducts: `${BASE_URL}/get_AllproductDetails`,

  //add order
  addOrder: (table_no, total_amount, instruction) =>
    `${BASE_URL}/add_order.php?user_id=Admin&tableno=${table_no}&total_amount=${total_amount}&instruction=${instruction}`,
  getOrder: userId => `${BASE_URL}/get_order_details.php?user_id=${userId}`,
};
