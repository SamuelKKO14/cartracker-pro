'use client'

import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { BookingForm } from '@/components/booking/booking-form'

export default function ReserverPage() {
  return (
    <div className="bg-[#06090f] text-gray-100 min-h-screen font-sans">
      <Navbar />

      <main className="pt-28 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-100">
              Réserver un rendez-vous
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Choisissez votre prestation, un créneau disponible, et confirmez votre réservation.
            </p>
          </div>

          <BookingForm />
        </div>
      </main>

      <Footer />
    </div>
  )
}
