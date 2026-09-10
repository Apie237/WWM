import CTAButton from '../components/ui/CTAButton.jsx'
import Container from '../components/ui/Container.jsx'

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-wwm-gold">404</p>
      <h1 className="mt-3 text-2xl font-extrabold uppercase tracking-wide text-wwm-navy sm:text-3xl">Page Not Found</h1>
      <p className="mt-3 max-w-md text-sm text-wwm-neutral-600">
        The page you are looking for doesn&rsquo;t exist or may have moved.
      </p>
      <CTAButton to="/" variant="tertiary" className="mt-8">
        Return Home
      </CTAButton>
    </Container>
  )
}
