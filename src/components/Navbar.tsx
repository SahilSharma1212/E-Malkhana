import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export default function Navbar() {
  return (
    <nav className="w-full bg-blue-100 text-white shadow-md py-2 px-1.5">
          <div className="w-full mx-auto px-4 py-3 flex items-center justify-between bg-blue-500 rounded-sm pr-10">
            <Link href={'/'} className="flex justify-center gap-4 items-center">
              <div className=" flex items-center justify-center">
                <Image
                  src="/CG_POLICE_LOGO.png"
                  alt="Logo"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>

              {/* Logo Placeholder */}

              {/* Logo / Title */}
              <div className="text-xl font-bold tracking-wide max-sm:hidden">
                E-Malkhana System
              </div>
              <div className="text-xl sm:hidden max-md:text-base font-bold tracking-wide max-sm:visible">
                E-Malkhana
              </div>
            </Link>


            {/* Navigation Links */}
            <div className="space-x-4 text-sm md:text-base max-md:text-sm">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <Link href="/search-property" className="hover:underline">
                Search
              </Link>
            </div>
          </div>
        </nav>
  )
}
