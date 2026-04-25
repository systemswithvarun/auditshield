"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle, Users, Crown, Trash2, Mail, Send } from "lucide-react";

type Member = {
  id: string;
  user_id: string;
  role: "owner" | "manager";
  created_at: string;
};

type Invite = {
  id: string;
  email: string;
  accepted: boolean;
  expires_at: string;
  created_at: string;
};

export default function TeamPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orgId, setOrgId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentRole, setCurrentRole] = useState<"owner" | "manager">("manager");
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUserId(user.id);

        const { data: orgData } = await supabase.rpc("get_my_organization");
        if (!orgData?.exists) return;
        setOrgId(orgData.id);
        setCurrentRole(orgData.role);

        await fetchData(orgData.id);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchData = async (oid: string) => {
    const { data: memberData } = await supabase
      .from("organization_members")
      .select("id, user_id, role, created_at")
      .eq("organization_id", oid)
      .order("created_at", { ascending: true });
    setMembers(memberData || []);

    const { data: inviteData } = await supabase
      .from("manager_invites")
      .select("id, email, accepted, expires_at, created_at")
      .eq("organization_id", oid)
      .eq("accepted", false)
      .order("created_at", { ascending: false });
    setInvites(inviteData || []);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !orgId) return;
    setInviting(true);
    setError("");
    setSuccessMsg("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate a secure random token
      const token = crypto.randomUUID() + "-" + crypto.randomUUID();

      const { error: insertErr } = await supabase
        .from("manager_invites")
        .insert({
          organization_id: orgId,
          invited_by: user.id,
          email: inviteEmail.trim().toLowerCase(),
          token,
        });

      if (insertErr) throw insertErr;

      const inviteUrl = `${window.location.origin}/invite?token=${token}`;
      setSuccessMsg(`Invite created. Send this link to ${inviteEmail.trim()}: ${inviteUrl}`);
      setInviteEmail("");
      await fetchData(orgId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    await supabase.from("manager_invites").delete().eq("id", inviteId);
    await fetchData(orgId);
  };

  const handleRemoveMember = async (memberId: string) => {
    await supabase.from("organization_members").delete().eq("id", memberId);
    await fetchData(orgId);
  };

  if (loading) return (
    <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#0F172A]/30" />
    </div>
  );

  return (
    <div className="max-w-[900px] mx-auto p-4 sm:p-8 text-[#0d1c2d] animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight mb-1 flex items-center gap-2">
          <Users className="text-[#245D91]" /> Team
        </h1>
        <p className="text-[#45464d] text-[15px]">Manage who has access to your AuditShield dashboard.</p>
      </div>

      {error && (
        <div className="mb-6 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 bg-[#f0fdf4] border border-[#22C55E]/30 text-[#166534] px-4 py-3 rounded-xl text-[14px] break-all">
          <p className="font-semibold mb-1">Invite link ready — copy and send it manually:</p>
          <p className="font-mono text-[13px]">{successMsg.split(": ").slice(1).join(": ")}</p>
        </div>
      )}

      {/* Invite Form */}
      <div className="bg-white border border-black/10 rounded-2xl p-6 mb-8 shadow-sm">
        <h2 className="text-[15px] font-bold mb-4 flex items-center gap-2"><Mail size={16} /> Invite a Manager</h2>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            required
            placeholder="manager@restaurant.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="flex-1 h-[42px] border border-black/10 rounded-xl px-3 text-[14px] outline-none focus:border-black/30 transition-colors"
          />
          <button
            type="submit"
            disabled={inviting}
            className="h-[42px] bg-[#0F172A] text-white px-5 rounded-xl text-[14px] font-medium hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {inviting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Send Invite
          </button>
        </form>
        <p className="text-[12px] text-[#94a3b8] mt-3">Invite links expire after 7 days. The invitee must sign in with Google using the email above.</p>
      </div>

      {/* Current Members */}
      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm mb-6">
        <div className="p-5 border-b border-black/10 bg-[#f8f9ff]">
          <h2 className="text-[15px] font-bold">Active Members</h2>
        </div>
        <div className="divide-y divide-black/5">
          {members.map(m => (
            <div key={m.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#f1f5f9] border border-[#cbd5e1] flex items-center justify-center">
                  {m.role === "owner" ? <Crown size={16} className="text-[#245D91]" /> : <Users size={16} className="text-[#94a3b8]" />}
                </div>
                <div>
                  <div className="text-[14px] font-medium">{m.user_id === currentUserId ? "You" : m.user_id.slice(0, 8) + "…"}</div>
                  <div className="text-[12px] text-[#94a3b8] capitalize">{m.role}</div>
                </div>
              </div>
              {m.role !== "owner" && currentRole === "owner" && m.user_id !== currentUserId && (
                <button
                  onClick={() => handleRemoveMember(m.id)}
                  className="w-8 h-8 flex items-center justify-center text-[#94a3b8] hover:text-[#ba1a1a] hover:bg-[#FFF4F4] rounded-lg transition-colors"
                  title="Remove member"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-black/10 bg-[#f8f9ff]">
            <h2 className="text-[15px] font-bold">Pending Invites</h2>
          </div>
          <div className="divide-y divide-black/5">
            {invites.map(inv => (
              <div key={inv.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-medium">{inv.email}</div>
                  <div className="text-[12px] text-[#94a3b8]">
                    Expires {new Date(inv.expires_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeInvite(inv.id)}
                  className="w-8 h-8 flex items-center justify-center text-[#94a3b8] hover:text-[#ba1a1a] hover:bg-[#FFF4F4] rounded-lg transition-colors"
                  title="Revoke invite"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
