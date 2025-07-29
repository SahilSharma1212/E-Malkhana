
import PropertyForm from '@/components/PropertyForm'
import Image from 'next/image'
import React from 'react'
import { Toaster } from 'react-hot-toast'

export default function page() {
  return (
    // This is the main page of the application
    <div className='flex flex-col items-center justify-start max-h-screen w-full overflow-x-hidden scrollbar-hidden'>


      {/* This is the div for department logo and name and description */}
      <div className='px-3 py-1 flex w-full justify-around shadow-md'>


        {/* This is the div for the logo name and description of the department */}
        <div className='w-[20%]  bg-blue-500 flex flex-col items-center  rounded-l-lg justify-evenly max-xl:hidden'>
          <Image
            src="/CG_POLICE_LOGO.png"
            alt="Chhattisgarh Police Logo"
            width={216}  // 54 * 4 = 216px
            height={336} // 84 * 4 = 336px
            className="rounded-md object-contain"
          />
          <p className='text-3xl font-bold text-white text-center'>Chhattisgarh Police</p>
          <p className=' text-white text-lg w-[70%] text-center text-wrap font-semibold max-xl:text-sm'>E Malkhana Managment System</p>


        </div>


        <PropertyForm />

      </div>
      <Toaster />
    </div>
  )
}
