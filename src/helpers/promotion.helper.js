export const calculateFinalPrice = (product) => {
    if (!product.promotion) {
        return product.price;
    }

    const { price } = product;
    const { discountPercentage = 0, maxDiscountAmount = 0 } = product.promotion;

    const discountAmount = (price * discountPercentage) / 100;

    const actualDiscount =
        maxDiscountAmount > 0
            ? Math.min(discountAmount, maxDiscountAmount)
            : discountAmount;

    const finalPrice = Math.round(price - actualDiscount);

    return finalPrice;
};

export const getPromotionProjectStage = () => ({
    $project: {
        _id: 1,
        name: 1,
        slug: 1,
        mainImage: 1,
        images: 1,
        description: 1,
        price: 1,
        enable: 1,
        tags: 1,
        variants: 1,
        totalQuantity: 1,
        capacity: 1,
        price: 1,
        isPromotion: 1,
        promotion: {
            $cond: {
                if: "$isPromotion",
                then: {
                    id: "$promotionData._id",
                    name: "$promotionData.name",
                    discountPercentage: {
                        $convert: {
                            input: {
                                $ifNull: [
                                    { $first: "$promotionProduct.discountPercentage" },
                                    0,
                                ],
                            },
                            to: "double",
                        },
                    },
                    maxDiscountAmount: {
                        $convert: {
                            input: {
                                $ifNull: [{ $first: "$promotionProduct.maxDiscountAmount" }, 0],
                            },
                            to: "double",
                        },
                    },
                    startDate: "$promotionData.startDate",
                    endDate: "$promotionData.endDate",
                },
                else: null,
            },
        },
    },
});