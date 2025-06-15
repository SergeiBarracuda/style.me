/**
 * API endpoint for handling directions requests
 * This acts as a proxy to the Google Directions API
 */

import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_MAPS_API_KEY } from '@/lib/maps';

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const mode = searchParams.get('mode') || 'driving';
  
  // Validate required parameters
  if (!origin || !destination) {
    return NextResponse.json(
      { error: 'Origin and destination are required' },
      { status: 400 }
    );
  }
  
  try {
    // Call Google Directions API
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.append('origin', origin);
    url.searchParams.append('destination', destination);
    url.searchParams.append('mode', mode);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Google Directions API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process and simplify the response
    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];
      
      // Format the response
      const formattedResponse = {
        distance: leg.distance.text,
        duration: leg.duration.text,
        steps: leg.steps.map((step: any) => {
          // Remove HTML tags from instructions
          const instruction = step.html_instructions.replace(/<[^>]*>/g, '');
          return instruction;
        }),
        polyline: route.overview_polyline.points,
      };
      
      return NextResponse.json(formattedResponse);
    } else {
      return NextResponse.json(
        { error: `Directions not found: ${data.status}` },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error fetching directions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch directions' },
      { status: 500 }
    );
  }
}
