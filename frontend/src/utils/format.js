export const formatPrice = (price) => {
    const num = typeof price === 'number' ? price : parseFloat(price || 0);
    return `${Math.round(num)} BYN`;
};

export const formatPriceWithDiscount = (originalPrice, salePrice, discountPercent) => {
    if (discountPercent > 0) {
        return `${Math.round(salePrice)} BYN`;
    }
    return `${Math.round(originalPrice)} BYN`;
};