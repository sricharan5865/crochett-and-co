import HeroSection from "@/components/home/hero-section";
import FeaturedProducts from "@/components/home/featured-products";
import ShopByOccasion from "@/components/home/shop-by-occasion";
import CustomDesignCTA from "@/components/home/custom-design-cta";
import Testimonials from "@/components/home/testimonials";
import InstagramWall from "@/components/home/instagram-wall";
import Newsletter from "@/components/home/newsletter";
import FAQSection from "@/components/home/faq-section";
import { getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getProducts();

  return (
    <>
      <HeroSection />
      <FeaturedProducts initialProducts={products} />
      <ShopByOccasion />
      <CustomDesignCTA />
      <Testimonials />
      <InstagramWall />
      <Newsletter />
      <FAQSection />
    </>
  );
}
