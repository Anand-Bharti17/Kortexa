import ProductCard from "./ui/ProductCard";

export default function ProductDiscoveryRow({
  title,
  subtitle,
  products,
  onProductClick,
  onAddToCart,
  onWishlistToggle,
  isWishlisted,
}) {
  if (!products?.length) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => onProductClick(product)}
            onAddToCart={onAddToCart ? (e) => onAddToCart(e, product) : undefined}
            onWishlistToggle={
              onWishlistToggle ? (e) => onWishlistToggle(e, product.id) : undefined
            }
            wishlisted={isWishlisted?.(product.id)}
          />
        ))}
      </div>
    </section>
  );
}
