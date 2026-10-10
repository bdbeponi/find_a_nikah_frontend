"use client";

// Guided live check: close-up, then turn left and right (order chosen by the
// server). No upload button on purpose - frames come only from the camera, on
// a timer, so there is no moment to swap in a saved photo.

import React, { useEffect, useRef, useState } from "react";
import {
    useStartFaceSessionMutation,
    useVerifyFaceMutation,
} from "@/redux/features/moderationApi";

const STEP_SECONDS = 4; // time given to get into each pose before the frame is taken
const THRESHOLD = 0.6; // keep in step with MATCH_THRESHOLD on the backend
const BAR_MAX = 1.0;

const COPY = {
    front: { title: "Look straight ahead", hint: "Bring your face close so it fills the oval." },
    left: { title: "Turn your head to your left", hint: "Turn slowly. Keep your face inside the oval." },
    right: { title: "Turn your head to your right", hint: "Turn slowly. Keep your face inside the oval." },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function FaceVerificationTestPage() {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const runningRef = useRef(false);
    const urlsRef = useRef([]);

    const [phase, setPhase] = useState("idle"); // idle | starting | capturing | checking | done
    const [challenges, setChallenges] = useState([]);
    const [stepIndex, setStepIndex] = useState(0);
    const [countdown, setCountdown] = useState(0);
    const [shots, setShots] = useState([]);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    const [startSession] = useStartFaceSessionMutation();
    const [verifyFace] = useVerifyFaceMutation();

    /* ------------------------------------------------------------ camera */
    const stopCamera = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
    };

    const openCamera = async () => {
        try {
            // getUserMedia only works on https:// or http://localhost
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 1280 } },
                audio: false,
            });
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            return true;
        } catch (err) {
            setErrorMsg(
                err?.name === "NotAllowedError"
                    ? "Camera permission was denied. Allow it in the browser address bar and try again."
                    : "Could not open the camera."
            );
            return false;
        }
    };

    const grabFrame = () =>
        new Promise((resolve) => {
            const v = videoRef.current;
            if (!v?.videoWidth) return resolve(null);
            const c = document.createElement("canvas");
            c.width = v.videoWidth;
            c.height = v.videoHeight;
            c.getContext("2d").drawImage(v, 0, 0); // un-mirrored, as the server expects
            c.toBlob(resolve, "image/jpeg", 0.92);
        });

    const clearShots = () => {
        urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
        urlsRef.current = [];
        setShots([]);
    };

    useEffect(
        () => () => {
            runningRef.current = false;
            stopCamera();
            urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
        },
        []
    );

    /* -------------------------------------------------------------- flow */
    const cancel = () => {
        runningRef.current = false;
        stopCamera();
        setPhase("idle");
    };

    const begin = async () => {
        setErrorMsg("");
        setResult(null);
        clearShots();
        setPhase("starting");

        let session;
        try {
            session = (await startSession().unwrap()).data;
        } catch (err) {
            setErrorMsg(err?.data?.message || "Could not start the check.");
            setPhase("idle");
            return;
        }

        if (!(await openCamera())) {
            setPhase("idle");
            return;
        }

        runningRef.current = true;
        setChallenges(session.challenges);
        setPhase("capturing");

        const frames = [];
        const thumbs = [];
        for (let i = 0; i < session.challenges.length; i++) {
            setStepIndex(i);
            for (let s = STEP_SECONDS; s > 0; s--) {
                setCountdown(s);
                await sleep(1000);
                if (!runningRef.current) return;
            }
            const blob = await grabFrame();
            if (!blob) {
                cancel();
                setErrorMsg("The camera did not return an image. Try again.");
                return;
            }
            const url = URL.createObjectURL(blob);
            urlsRef.current.push(url);
            frames.push(blob);
            thumbs.push({ challenge: session.challenges[i], url });
            setShots([...thumbs]);
        }

        runningRef.current = false;
        stopCamera();
        setPhase("checking");

        try {
            const res = await verifyFace({ sessionId: session.sessionId, frames }).unwrap();
            setResult({ ...res.data, message: res.message });
        } catch (err) {
            setErrorMsg(
                err?.data?.message ||
                (err?.status === "FETCH_ERROR" ? "Could not reach the server." : "Verification failed.")
            );
        }
        setPhase("done");
    };

    /* ------------------------------------------------------------ render */
    const live = phase === "capturing";
    const current = challenges[stepIndex];
    const distance = result?.distance;
    const barPct = typeof distance === "number" ? Math.min(100, (distance / BAR_MAX) * 100) : 0;

    return (
        <section className="mx-auto max-w-2xl p-4 sm:p-6">
            <h1 className="text-2xl font-semibold text-neutral-900">Test live face verification</h1>
            <p className="mt-1 text-sm text-neutral-600">
                You will be asked for a close-up and two head turns. Each photo is taken
                automatically after a short countdown and compared with the first photo on
                your own profile.
            </p>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row">
                <div className="w-full max-w-xs">
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-neutral-300 bg-neutral-100">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`h-full w-full -scale-x-100 object-cover ${live ? "" : "hidden"}`}
                        />
                        {live && (
                            <>
                                <div className="pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-4 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                                <div className="absolute bottom-3 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-black/60 text-xl font-semibold text-white">
                                    {countdown}
                                </div>
                            </>
                        )}
                        {!live && (
                            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-neutral-500">
                                {phase === "checking"
                                    ? "Checking your photos…"
                                    : phase === "starting"
                                        ? "Starting…"
                                        : "The camera opens when you start."}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-1 flex-col gap-3">
                    <div aria-live="polite" className="min-h-[3.5rem]">
                        {live && current && (
                            <>
                                <p className="text-lg font-semibold text-neutral-900">{COPY[current].title}</p>
                                <p className="text-sm text-neutral-600">{COPY[current].hint}</p>
                            </>
                        )}
                    </div>

                    <ol className="space-y-1.5 text-sm">
                        {(challenges.length ? challenges : ["front", "left", "right"]).map((c, i) => {
                            const done = i < shots.length;
                            const active = live && i === stepIndex && !done;
                            return (
                                <li
                                    key={`${c}-${i}`}
                                    className={`flex items-center gap-2 ${done ? "text-emerald-700" : active ? "font-medium text-neutral-900" : "text-neutral-500"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-2.5 w-2.5 rounded-full ${done ? "bg-emerald-600" : active ? "bg-neutral-900" : "bg-neutral-300"
                                            }`}
                                    />
                                    {challenges.length ? COPY[c].title : i === 0 ? "Close-up" : "Head turn"}
                                    {done && " (taken)"}
                                </li>
                            );
                        })}
                    </ol>

                    {(phase === "idle" || phase === "done") && (
                        <button
                            type="button"
                            onClick={begin}
                            className="mt-auto rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                        >
                            {phase === "done" ? "Run it again" : "Start live check"}
                        </button>
                    )}
                    {live && (
                        <button
                            type="button"
                            onClick={cancel}
                            className="mt-auto rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {errorMsg && (
                <div role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    {errorMsg}
                </div>
            )}

            {shots.length > 0 && (
                <div className="mt-5 flex gap-3">
                    {shots.map((s, i) => (
                        <figure key={i} className="w-24">
                            <img src={s.url} alt={`${s.challenge} shot`} className="aspect-[3/4] w-full rounded-md border border-neutral-200 object-cover" />
                            <figcaption className="mt-1 text-xs text-neutral-600">{s.challenge}</figcaption>
                        </figure>
                    ))}
                </div>
            )}

            {result && (
                <div
                    role="status"
                    className={`mt-5 rounded-md border p-4 ${result.isFaceVerified ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                        }`}
                >
                    <h2 className={`text-lg font-semibold ${result.isFaceVerified ? "text-emerald-900" : "text-red-900"}`}>
                        {result.isFaceVerified ? "Face verified" : "Face did not match"}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-700">{result.message}</p>

                    <div className="mt-3">
                        <div className="relative h-2.5 w-full rounded-full bg-neutral-200">
                            <div
                                className={`h-full rounded-full ${result.isFaceVerified ? "bg-emerald-600" : "bg-red-600"}`}
                                style={{ width: `${barPct}%` }}
                            />
                            <div
                                className="absolute -top-1 w-0.5 bg-neutral-900"
                                style={{ left: `${(THRESHOLD / BAR_MAX) * 100}%`, height: "18px" }}
                                title={`Cut-off ${THRESHOLD}`}
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-neutral-600">
                            Close-up vs profile photo: {distance?.toFixed(3)}. The tick marks the cut-off at {THRESHOLD}.
                        </p>
                    </div>

                    <table className="mt-3 w-full text-left text-xs text-neutral-700">
                        <thead>
                            <tr className="text-neutral-500">
                                <th className="py-1 font-medium">Pose</th>
                                <th className="py-1 font-medium">Head angle</th>
                                <th className="py-1 font-medium">Face size</th>
                                <th className="py-1 font-medium">Distance to close-up</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.steps?.map((s) => (
                                <tr key={s.challenge}>
                                    <td className="py-0.5">{s.challenge}</td>
                                    <td className="py-0.5">{s.yaw}</td>
                                    <td className="py-0.5">{s.faceRatio}</td>
                                    <td className="py-0.5">{s.distanceToFront ?? "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="mt-2 text-xs text-neutral-500">
                        Head angle 0.5 is straight on. The server wants about 0.62 or more for a left turn and 0.38 or less for a right turn.
                    </p>
                </div>
            )}
        </section>
    );
}