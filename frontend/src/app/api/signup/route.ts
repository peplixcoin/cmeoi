import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  const { Username, Password, mobile_no, email, role } = await request.json();

  try {
    // Sending the signup request to your Express backend
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/signup`, {
      Username,
      Password,
      mobile_no,
      email,
      role,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { message: error.response?.data?.message || "An error occurred" },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json({ message: "Unknown error occurred" }, { status: 500 });
  }
}
