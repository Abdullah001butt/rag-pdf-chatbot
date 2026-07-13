import { LandingNav } from "@/components/landing/LandingNav"
import { Hero } from "@/components/landing/Hero"
import { ProductPreview } from "@/components/landing/ProductPreview"
import { UseCases } from "@/components/landing/UseCases"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { FeatureSplit } from "@/components/landing/FeatureSplit"
import { EditorSuite } from "@/components/landing/EditorSuite"
import { Comparison } from "@/components/landing/Comparison"
import { Pricing } from "@/components/landing/Pricing"
import { Security } from "@/components/landing/Security"
import { Faq } from "@/components/landing/Faq"
import { FinalCta } from "@/components/landing/FinalCta"
import { LandingFooter } from "@/components/landing/LandingFooter"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <LandingNav />
      <Hero />
      <ProductPreview />
      <UseCases />
      <HowItWorks />
      <FeatureSplit />
      <EditorSuite />
      <Comparison />
      <Pricing />
      <Security />
      <Faq />
      <FinalCta />
      <LandingFooter />
    </div>
  )
}
