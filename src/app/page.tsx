import ImageSection from '@/_components/ImageSection'
import PropertyForm from '@/_components/PropertyForm'
import SearchPropertyBox from '@/_components/SearchPropertyBox'
import Image from 'next/image'
import React from 'react'

export default function page() {
  return (
    // This is the main page of the application
    <div className='flex flex-col items-center justify-evenly min-h-screen w-full overflow-x-hidden overflow-y-scroll scrollbar-hidden'>


      {/* This is the div for department logo and name and description */}
      <div className='px-3 py-1 flex w-full justify-around shadow-md'>


        {/* This is the div for the logo name and description of the department */}
        <div className='min-h-130 w-[20%]  bg-blue-500 flex flex-col items-center  rounded-l-lg justify-evenly max-lg:hidden'>
          <Image
            src="/CG_POLICE_LOGO.png"
            alt="Chhattisgarh Police Logo"
            width={216}  // 54 * 4 = 216px
            height={336} // 84 * 4 = 336px
            className="rounded-md object-contain"
          />
          <p className='text-3xl font-bold text-white'>Chhattisgarh Police</p>
          <p className=' text-white text-lg w-[70%] text-center text-wrap font-semibold'>E Malkhana Managment System</p>


        </div>

        {/* This is the div for the form data and all the input fields  and upload image feature */}
        <div className='flex items-center justify-around bg-white w-[80%] max-lg:w-[100%]'>

          {/* This is the div for the form data */}
          <PropertyForm/>

          <ImageSection />
        </div>
      </div>

      {/* This is the div for implementing the search of any object */}
      <div className="w-screen px-3 py-1 h-60">
        <SearchPropertyBox/>
      </div>
    </div>
  )
}
