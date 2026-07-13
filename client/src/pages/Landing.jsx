import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import ProductShowcase from "../components/landing/ProductShowcase";
import Workflow from "../components/landing/Workflow";
import WhyChoose from "../components/landing/WhyChoose";
import Statistics from "../components/landing/Statistics";
import TechStack from "../components/landing/TechStack";
import FAQ from "../components/landing/FAQ";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <ProductShowcase />
      <Workflow />
      <WhyChoose />
      <Statistics />
      <TechStack />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}