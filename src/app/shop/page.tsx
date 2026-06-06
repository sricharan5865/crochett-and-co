import { getProducts } from "@/lib/db";
import ShopClient from "./shop-client";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await getProducts();
  return <ShopClient initialProducts={products} />;
}
