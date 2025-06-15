import React from 'react';
import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Beauty Service Marketplace</title>
        <meta name="description" content="Find and book beauty services near you" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
            Beauty Service Marketplace
          </h1>
          
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-lg text-gray-600 mb-8">
              Najděte a rezervujte si kosmetické služby ve vašem okolí
            </p>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Vítejte v Beauty Marketplace!</h2>
              <p className="text-gray-600 mb-4">
                Kompletní platforma pro rezervace kosmetických služeb
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Pro klienty</h3>
                  <ul className="text-sm text-blue-600 mt-2 space-y-1">
                    <li>• Vyhledávání služeb</li>
                    <li>• Online rezervace</li>
                    <li>• Hodnocení poskytovatelů</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Pro poskytovatele</h3>
                  <ul className="text-sm text-green-600 mt-2 space-y-1">
                    <li>• Správa kalendáře</li>
                    <li>• Platby online</li>
                    <li>• Komunikace s klienty</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  🚀 Aplikace je připravena k nasazení s MongoDB Atlas a Heroku
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

