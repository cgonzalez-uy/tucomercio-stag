import { Link } from 'react-router-dom';
import { useBanners } from '../lib/hooks/useBanners';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
// Import Swiper React components
import { Swiper, SwiperSlide, useSwiper } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

// Navigation buttons component
function SwiperNavButtons() {
  const swiper = useSwiper();
  return (
    <div className="absolute -left-2 -right-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-10">
      <Button
        variant="outline"
        size="icon"
        onClick={() => swiper.slidePrev()}
        className="pointer-events-auto bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white"
        disabled={swiper.isBeginning}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => swiper.slideNext()}
        className="pointer-events-auto bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white"
        disabled={swiper.isEnd}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function HeroBannerCarousel() {
  const { getActiveBanners, loading } = useBanners();
  const activeBanners = getActiveBanners();

  if (loading) {
    return (
      <div className="w-full aspect-square md:aspect-[21/9] bg-gray-100 animate-pulse rounded-xl" />
    );
  }

  if (activeBanners.length === 0) {
    return null;
  }

  return (
    <div className="relative px-0 sm:px-0 mb-5">
      <Swiper
        modules={[Navigation, Autoplay]}
        slidesPerView={1}
        navigation={false}
        loop={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        className="rounded-xl overflow-hidden shadow-md"
      >
        {activeBanners.map((banner) => (
          <SwiperSlide key={banner.id}>
            {banner.buttonLink ? (
              <Link to={banner.buttonLink}>
                <img
                  src={banner.image}
                  alt=""
                  className="w-full h-auto max-h-[500px] aspect-square md:aspect-[21/9] object-cover"
                />
              </Link>
            ) : (
              <img
                src={banner.image}
                alt=""
                className="w-full h-auto max-h-[500px] aspect-square md:aspect-[21/9] object-cover"
              />
            )}
          </SwiperSlide>
        ))}
        <SwiperNavButtons />
      </Swiper>
    </div>
  );
}