"use client"
import React, { useState } from 'react';
import { FaGoogle } from "react-icons/fa";
import { auth } from '@/config/firebaseConfig';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
} from "firebase/auth";
import toast, { Toaster } from "react-hot-toast"
import axios from "axios"
import { Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Page() {
    const [signinSuccessfull, setSignInSuccessfull] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter();

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true)
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            // Send the verifiable Firebase ID token to the server (not just an
            // email) so the session can only be minted for the actual signed-in
            // user.
            const idToken = await result.user.getIdToken();

            const { data } = await axios.post("/api/verify-user", { idToken });

            if (data.allowed) {
                toast.success("Access granted");
                setSignInSuccessfull(true)
                router.replace("/admin");
            } else {
                await signOut(auth);
                toast.error("Access denied: not whitelisted");
                setLoading(false)
            }
        } catch (err) {
            console.error(err);
            toast.error("Google sign-in failed");
            setLoading(false)
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
            <div className="w-full max-w-md overflow-hidden rounded-md border border-border bg-card shadow-sm">
                {/* Navy header band — the console signature */}
                <div className="flex flex-col items-center gap-3 bg-primary px-8 py-8 text-center">
                    <Image
                        src="/CG_POLICE_LOGO.png"
                        alt="Chhattisgarh Police"
                        width={48}
                        height={48}
                        className="object-contain"
                    />
                    <div>
                        <h1 className="text-lg font-semibold tracking-wide text-white">E-MALKHANA</h1>
                        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/70">
                            Chhattisgarh Police · Evidence Console
                        </p>
                    </div>
                </div>

                <div className="space-y-5 px-8 py-7">
                    {signinSuccessfull ? (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <span className="grid size-12 place-items-center rounded-full border-2 border-success text-success">
                                <ShieldCheck className="size-6" />
                            </span>
                            <p className="text-base font-semibold text-foreground">Signed in successfully</p>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="size-4 animate-spin" /> Opening console…
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="text-center">
                                <h2 className="text-xl font-semibold text-foreground">Sign in</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Use your authorised police account to continue.
                                </p>
                            </div>

                            <button
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-sm bg-signal px-5 py-2.5 font-semibold text-signal-foreground transition-colors hover:bg-signal/90 disabled:opacity-60"
                            >
                                {loading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <FaGoogle />
                                )}
                                <span>Continue with Google</span>
                            </button>

                            <p className="text-center text-xs text-muted-foreground">
                                Access is restricted to whitelisted officers.
                            </p>
                        </>
                    )}
                </div>
            </div>
            <Toaster position="top-right" />
        </div>
    );
}
