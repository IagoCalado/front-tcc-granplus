export const STOCK_MOVEMENT_EVENT = "stock:movement-updated";
export const STOCK_MOVEMENT_STORAGE_KEY = "stock:lastMovementAt";

export const notifyStockMovement = () => {
  const timestamp = String(Date.now());

  try {
    window.localStorage.setItem(STOCK_MOVEMENT_STORAGE_KEY, timestamp);
  } catch {
    // Sem localStorage disponivel, segue apenas com evento em memoria.
  }

  window.dispatchEvent(
    new CustomEvent(STOCK_MOVEMENT_EVENT, {
      detail: { timestamp },
    }),
  );
};
