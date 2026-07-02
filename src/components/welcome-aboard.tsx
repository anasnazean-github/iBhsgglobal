"use client";

import * as React from "react";
import { Shield, BookOpen, LogOut, Check, X, FileText } from "lucide-react";
import { CustomButton } from "./custom-button";
import { updateOwnProfile, UserProfile } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { jsPDF } from "jspdf";

interface WelcomeAboardScreenProps {
  profile: UserProfile;
  idToken: string;
  onLogout: () => void;
  onComplete: (updatedProfile: UserProfile) => void;
}

const CONTRACT_TEXT = `iB - HSG GLOBAL Internal Bridge
Terms of Service and Non-Disclosure Agreement

By completing this registration form and requesting access to the HSG Global Internal Bridge ("iB"), you explicitly acknowledge, understand, and agree to the following terms and conditions:

1. Authorized Access and Employment Status
You acknowledge that this portal is strictly for the internal use of employees and authorized personnel of HSG GLOBAL PTE. LTD. Access to this portal is a privilege tied directly to your current employment or contract status. In the event that your relationship with HSG GLOBAL PTE. LTD. is terminated or concluded, your access privileges will be revoked immediately, and your account will be removed without prior notice.

2. Data Confidentiality and Non-Disclosure
All information, data, metrics, and content hosted within the iB are strictly Confidential and Proprietary. You are expressly prohibited from sharing, exporting, duplicating, or disclosing any data from this portal to any third party without the explicit written consent of the Director or an authorized representative acting on behalf of the company.

3. Accountability and Data Integrity
You bear full responsibility and accountability for all activities, modifications, and data entries performed under your registered account. You agree to maintain the highest standards of data integrity and ensure that all information input into the system is accurate and truthful.

4. Prohibition of Sabotage and Misconduct
Any deliberate attempt to sabotage, corrupt, or manipulate data—including but not limited to providing intentionally false inputs, deleting critical records, or compromising system security—is strictly prohibited. Any such misconduct will result in immediate termination of portal access, disciplinary action, and potential legal and financial liability for damages caused.

5. No Financial Transactions
The iB is exclusively an operational tool. It does not require, request, or accept any form of payment, subscription fees, or financial transactions. Be vigilant against any unauthorized requests for financial information within this platform.`;

export function WelcomeAboardScreen({ profile, idToken, onLogout, onComplete }: WelcomeAboardScreenProps) {
  const [name, setName] = React.useState(profile.name || "");
  const [phone, setPhone] = React.useState("");
  const [showContract, setShowContract] = React.useState(false);
  const [scrolledToBottom, setScrolledToBottom] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [contractText, setContractText] = React.useState(CONTRACT_TEXT);

  React.useEffect(() => {
    fetch("/sign-up contract.txt")
      .then((res) => {
        if (res.ok) return res.text();
        throw new Error("Failed to load");
      })
      .then((text) => {
        if (text && text.trim().length > 0) {
          setContractText(text);
        }
      })
      .catch((err) => {
        console.warn("Could not load sign-up contract.txt from server, using fallback:", err);
      });
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 15;
    if (isAtBottom) {
      setScrolledToBottom(true);
    }
  };

  const handleDownloadAndAccept = async () => {
    setLoading(true);
    try {
      // 1. Generate and download signed contract PDF
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("iB - HSG GLOBAL Internal Bridge", 20, 20);
      doc.setFontSize(11);
      doc.text("Terms of Service and Non-Disclosure Agreement", 20, 27);
      doc.line(20, 31, 190, 31);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const splitText = doc.splitTextToSize(contractText, 170);
      doc.text(splitText, 20, 40);

      const finalY = 40 + (splitText.length * 4.8);
      doc.line(20, finalY, 190, finalY);
      doc.setFont("helvetica", "bold");
      doc.text(`Signed by: ${name}`, 20, finalY + 10);
      doc.text(`Contact: ${phone}`, 20, finalY + 16);
      const signedNow = new Date();
      const signedDateStr = signedNow.toLocaleDateString("en-GB") + " " + signedNow.toLocaleTimeString([], { hour12: false });
      doc.text(`Date signed: ${signedDateStr}`, 20, finalY + 22);

      doc.save("ib-NDA-contract.pdf");
      showToast("Signed contract PDF downloaded successfully!", "success");

      // 2. Save profile updates to database
      const updated = await updateOwnProfile(idToken, profile.email, name, phone);
      onComplete(updated);
      showToast("Profile credentials updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setLoading(false);
      setShowContract(false);
    }
  };

  const handleOpenContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast("Please fill in both Name and Phone Number.", "warning");
      return;
    }
    setShowContract(true);
    setScrolledToBottom(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#EEEEEE] p-6 font-primary animate-fade-in">
      <div className="w-full max-w-lg bg-[#E5E5E5] border border-zinc-300 rounded-lg p-8 shadow-md flex flex-col gap-6">
        <div className="flex flex-col gap-1 text-center">
          <div className="mx-auto h-10 w-10 rounded-lg bg-zinc-700 text-white flex items-center justify-center shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 mt-3">Welcome Aboard!</h1>
          <p className="text-xs text-zinc-500 font-medium">Please complete your registration setup</p>
        </div>

        <div className="w-full border-t border-zinc-300/60" />

        <form onSubmit={handleOpenContract} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="h-10 px-3 bg-[#EEEEEE] border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Phone Number</label>
            <input 
              type="tel" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +65 8123 4567"
              className="h-10 px-3 bg-[#EEEEEE] border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400/20"
            />
          </div>

          <div className="flex flex-col gap-2 p-4 bg-[#EEEEEE]/50 border border-zinc-300 rounded-lg mt-1.5">
            <div className="flex gap-2.5">
              <BookOpen className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-zinc-700">NDA & Non-Disclosure Agreement</span>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Accessing the iB platform requires reviewing and signing the Non-Disclosure Agreement. After reviewing, accepting will download a PDF copy for your records.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-3">
            <CustomButton type="submit" variant="dark" className="w-full h-10 text-sm">
              Review & Sign Contract
            </CustomButton>
            
            <button 
              type="button"
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-bold w-fit mx-auto cursor-pointer focus-visible:outline-none"
            >
              <LogOut size={13} />
              <span>Log Out (Cancel)</span>
            </button>
          </div>
        </form>
      </div>

      {/* Scroll-to-End Contract Modal Popup */}
      {showContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-[#E5E5E5] border border-zinc-300 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-300 bg-[#EEEEEE]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-zinc-600" />
                <h3 className="text-base font-bold text-zinc-950">Terms of Service & Non-Disclosure</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowContract(false)}
                className="text-zinc-400 hover:text-zinc-800 rounded-md p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable text container */}
            <div 
              onScroll={handleScroll}
              className="flex-1 min-h-0 p-6 overflow-y-auto bg-zinc-50 text-zinc-700 text-xs leading-relaxed border-b border-zinc-300 whitespace-pre-wrap font-primary select-text"
            >
              {contractText}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 bg-[#EEEEEE] border-t border-zinc-300">
              <span className="text-[10px] text-zinc-500 font-bold shrink-0">
                {scrolledToBottom ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <Check size={13} className="stroke-[3]" /> Read Completed
                  </span>
                ) : (
                  <span>Please scroll to the bottom to unlock</span>
                )}
              </span>
              
              <div className="flex items-center gap-3">
                <CustomButton 
                  type="button" 
                  variant="default"
                  onClick={() => setShowContract(false)}
                >
                  Cancel
                </CustomButton>
                <CustomButton 
                  type="button" 
                  variant="dark"
                  disabled={!scrolledToBottom || loading}
                  onClick={handleDownloadAndAccept}
                >
                  {loading ? "Signing..." : "Accept Contract"}
                </CustomButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
