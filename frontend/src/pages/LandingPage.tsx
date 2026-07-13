import { LandingNav } from "@/components/landing/LandingNav"
import { Hero } from "@/components/landing/Hero"
import { ProductPreview } from "@/components/landing/ProductPreview"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { FeatureSplit } from "@/components/landing/FeatureSplit"
import { EditorSuite } from "@/components/landing/EditorSuite"
import { Pricing } from "@/components/landing/Pricing"
import { Faq } from "@/components/landing/Faq"
import { FinalCta } from "@/components/landing/FinalCta"
import { LandingFooter } from "@/components/landing/LandingFooter"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <LandingNav />
      <Hero />
      <ProductPreview />
      <HowItWorks />
      <FeatureSplit />
      <EditorSuite />
      <Pricing />
      <Faq />
      <FinalCta />
      <LandingFooter />
    </div>
  )
}
