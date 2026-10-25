import { ContainerScroll } from '@/components/ui/container-scroll-animation';

export function ShowroomScrollStory() {
  return (
    <div className="border-t border-[var(--line)] bg-[var(--soft-blue)]">
      <ContainerScroll
        titleComponent={<>
          <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[.22em] text-[var(--sea-glass)]">The Drivewell approach / 01—03</p>
          <h2 className="font-[Georgia,serif] text-[clamp(2.8rem,5vw,4.9rem)] leading-[1.04] tracking-[-.05em] text-[var(--deep-navy)]">From first look<br />to a confident choice.</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[var(--midnight-blue)] md:text-base">See what is here, check the live count and price, then decide at your own pace.</p>
        </>}
      >
        <div className="relative h-full w-full text-white">
          <img
            src="/images/showroom-unsplash.jpg"
            alt="Car displayed inside a showroom; illustrative photo, not a listed Drivewell vehicle"
            width="1600"
            height="1067"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a2bf2] via-[#0f1a2b4d] to-[#0f1a2b26]" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-4 p-5 text-[10px] font-extrabold uppercase tracking-[.18em] md:p-8">
            <span>Drivewell / the journey</span><span>Illustrative image</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
            <div className="mb-6 grid grid-cols-3 gap-2 border-b border-white/35 pb-3 text-[10px] font-bold uppercase tracking-[.13em] md:max-w-md md:gap-4">
              <span>01 / Browse</span><span>02 / Check stock</span><span>03 / Decide</span>
            </div>
            <h3 className="max-w-xl font-[Georgia,serif] text-3xl leading-tight tracking-[-.035em] md:text-5xl">Know what is available before you commit.</h3>
            <a href="#inventory" className="mt-6 inline-flex min-h-11 items-center border-b border-[var(--apricot)] text-sm font-bold text-white hover:text-[var(--apricot)]">Browse live listings <span className="ml-5" aria-hidden="true">↗</span></a>
          </div>
        </div>
      </ContainerScroll>
      <p className="-mt-6 pb-8 text-center text-[11px] text-[var(--midnight-blue)] md:-mt-10">Illustrative photo by <a className="underline underline-offset-2" href="https://unsplash.com/@mtonuk" target="_blank" rel="noreferrer">Mehmet Talha Onuk</a> on <a className="underline underline-offset-2" href="https://unsplash.com/photos/a-car-is-parked-inside-of-a-showroom-t9XRAidkBd0" target="_blank" rel="noreferrer">Unsplash</a>.</p>
    </div>
  );
}
