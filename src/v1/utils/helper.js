export const removeSpacingOnPhoneNumber = (phone) => {
  return phone.replace(/\s+/g, "");
};

export async function retryWithBackoff(fn, retries = 3, delay = 500) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries - 1) throw error;
      console.warn(`Retrying after ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
      delay *= 2; // Exponential backoff
    }
  }
}
