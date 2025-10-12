import React from 'react'
// The Home page now delegates all rendering to the `HomeContent` module. This
// keeps the page component lightweight and adheres to our separation of
// concerns: route-level pages handle routing, while modules provide the
// reusable UI logic. See `src/modules/HomeContent.tsx` for the full
// implementation of the landing page content.
import HomeContent from '@modules/HomeContent'

export default function Home() {
  return <HomeContent />
}