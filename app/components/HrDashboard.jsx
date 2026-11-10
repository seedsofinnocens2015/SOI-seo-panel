'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMaster } from '../context/MasterContext';
import { fetchRequisitions } from '../../lib/manpowerRequisitionApi';
import { fetchCandidates } from '../../lib/candidateMasterApi';
import { fetchRecruitmentPipeline } from '../../lib/recruitmentPipelineApi';
import { fetchInterviewRoundWise } from '../../lib/interviewTrackerApi';
import { fetchOffers } from '../../lib/offerTrackerApi';
import { fetchJoinings } from '../../lib/joiningTrackerApi';
import { fetchChecklists } from '../../lib/onboardingChecklistApi';
import { fetchFollowUps } from '../../lib/recruitmentFollowUpApi';
import { fetchUserSessions } from '../../lib/userSessionApi';
import { fetchManagedJobs } from '../../lib/jobApi';
import { fetchManagedApplications } from '../../lib/jobApplicationApi';

function formatDisplayDate(dStr) {
  if (!dStr) return '-';
  const d = new Date(dStr);
  if (Number.isNaN(d.getTime())) return dStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = months[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd} ${mm}, ${yyyy}`;
}

export default function HrDashboard({ currentUser, onNavigate }) {
  const { getDropdown } = useMaster();
  const masterCentres = getDropdown('centres') || [];

  // Filter state
  const [selectedCentre, setSelectedCentre] = useState('All');
  const now = new Date();
  const currentMonthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);

  const [loading, setLoading] = useState(true);

  // Raw data from DB
  const [rawRequisitions, setRawRequisitions] = useState([]);
  const [rawCandidates, setRawCandidates] = useState([]);
  const [rawPipeline, setRawPipeline] = useState([]);
  const [rawInterviews, setRawInterviews] = useState([]);
  const [rawOffers, setRawOffers] = useState([]);
  const [rawJoinings, setRawJoinings] = useState([]);
  const [rawChecklists, setRawChecklists] = useState([]);
  const [rawFollowUps, setRawFollowUps] = useState([]);
  const [rawSessions, setRawSessions] = useState([]);
  const [rawWebsiteJobs, setRawWebsiteJobs] = useState([]);
  const [rawWebsiteApps, setRawWebsiteApps] = useState([]);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        reqsRes,
        candsRes,
        pipeRes,
        intRes,
        offersRes,
        joinRes,
        chkRes,
        followRes,
        sessRes,
        jobsRes,
        appsRes,
      ] = await Promise.allSettled([
        fetchRequisitions(),
        fetchCandidates(),
        fetchRecruitmentPipeline(),
        fetchInterviewRoundWise(),
        fetchOffers(),
        fetchJoinings(),
        fetchChecklists(),
        fetchFollowUps(),
        fetchUserSessions(),
        fetchManagedJobs(),
        fetchManagedApplications(),
      ]);

      setRawRequisitions(reqsRes.status === 'fulfilled' && Array.isArray(reqsRes.value?.data) ? reqsRes.value.data : []);
      setRawCandidates(candsRes.status === 'fulfilled' && Array.isArray(candsRes.value?.data) ? candsRes.value.data : []);
      setRawPipeline(pipeRes.status === 'fulfilled' && Array.isArray(pipeRes.value?.data) ? pipeRes.value.data : []);
      setRawInterviews(intRes.status === 'fulfilled' && Array.isArray(intRes.value?.data) ? intRes.value.data : []);
      setRawOffers(offersRes.status === 'fulfilled' && Array.isArray(offersRes.value?.data) ? offersRes.value.data : []);
      setRawJoinings(joinRes.status === 'fulfilled' && Array.isArray(joinRes.value?.data) ? joinRes.value.data : []);
      setRawChecklists(chkRes.status === 'fulfilled' && Array.isArray(chkRes.value?.data) ? chkRes.value.data : []);
      setRawFollowUps(followRes.status === 'fulfilled' && Array.isArray(followRes.value) ? followRes.value : []);
      setRawSessions(sessRes.status === 'fulfilled' && Array.isArray(sessRes.value?.data) ? sessRes.value.data : []);
      setRawWebsiteJobs(jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value) ? jobsRes.value : []);
      setRawWebsiteApps(appsRes.status === 'fulfilled' && Array.isArray(appsRes.value) ? appsRes.value : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Available centres dropdown values
  const centreOptions = useMemo(() => {
    const set = new Set();
    masterCentres.forEach((c) => {
      const v = typeof c === 'string' ? c : c?.value;
      if (v) set.add(v);
    });
    rawRequisitions.forEach((r) => r.centre && set.add(r.centre));
    rawCandidates.forEach((c) => c.centre && set.add(c.centre));
    return Array.from(set).sort();
  }, [masterCentres, rawRequisitions, rawCandidates]);

  // Selected month year & month
  const [selYear, selMonthNum] = useMemo(() => {
    if (!selectedMonth) return [now.getFullYear(), now.getMonth()];
    const parts = selectedMonth.split('-');
    return [parseInt(parts[0], 10), parseInt(parts[1], 10) - 1];
  }, [selectedMonth]);

  // Centre match helper
  const matchesCentre = useCallback((itemCentre) => {
    if (selectedCentre === 'All' || !selectedCentre) return true;
    return (itemCentre || '').trim().toLowerCase() === selectedCentre.trim().toLowerCase();
  }, [selectedCentre]);

  // Month match helper
  const matchesMonth = useCallback((dateVal) => {
    if (!dateVal) return false;
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return false;
    return d.getFullYear() === selYear && d.getMonth() === selMonthNum;
  }, [selYear, selMonthNum]);

  // Filtered lists
  const filteredRequisitions = useMemo(() => rawRequisitions.filter((r) => matchesCentre(r.centre)), [rawRequisitions, matchesCentre]);
  const filteredCandidates = useMemo(() => rawCandidates.filter((c) => matchesCentre(c.centre)), [rawCandidates, matchesCentre]);
  const filteredPipeline = useMemo(() => rawPipeline.filter((p) => matchesCentre(p.centre)), [rawPipeline, matchesCentre]);
  const filteredInterviews = useMemo(() => rawInterviews.filter((i) => matchesCentre(i.centre)), [rawInterviews, matchesCentre]);
  const filteredOffers = useMemo(() => rawOffers.filter((o) => matchesCentre(o.centre)), [rawOffers, matchesCentre]);
  const filteredJoinings = useMemo(() => rawJoinings.filter((j) => matchesCentre(j.centre)), [rawJoinings, matchesCentre]);
  const filteredChecklists = useMemo(() => rawChecklists.filter((c) => matchesCentre(c.centre)), [rawChecklists, matchesCentre]);
  const filteredFollowUps = useMemo(() => rawFollowUps.filter((f) => matchesCentre(f.centre)), [rawFollowUps, matchesCentre]);

  // Executive KPI Calculations
  const kpis = useMemo(() => {
    // 1. Approved Positions
    const approvedReqs = filteredRequisitions.filter((r) => r.approvalStatus === 'Approved');
    const approvedPositions = approvedReqs.reduce((sum, r) => sum + (Number(r.positionsRequired) || 1), 0);

    // 2. Open Positions
    const openReqs = filteredRequisitions.filter(
      (r) => r.approvalStatus === 'Approved' && r.requisitionStatus !== 'Closed' && r.requisitionStatus !== 'Cancelled'
    );
    const openPositions = openReqs.reduce((sum, r) => {
      const openCount = typeof r.open === 'number' ? r.open : (Number(r.positionsRequired) || 1) - (Number(r.filled) || 0);
      return sum + Math.max(0, openCount);
    }, 0);

    // 3. Active in Pipeline
    const activeInPipeline = filteredPipeline.filter((p) => !p.pipelineStatus || p.pipelineStatus === 'Active').length;

    // 4. Interviews - Next 7 Days
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const in7Days = new Date(startToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    in7Days.setHours(23, 59, 59, 999);

    const interviewsNext7Days = filteredInterviews.filter((i) => {
      if (i.interviewStatus === 'Cancelled' || i.interviewStatus === 'Completed') return false;
      const d = new Date(i.interviewDate);
      return d >= startToday && d <= in7Days;
    }).length;

    // 5. Offers Released (Month)
    const offersReleasedMonth = filteredOffers.filter((o) => {
      const dateToUse = o.offerReleaseDate || o.offerRequestDate || o.createdAt;
      return matchesMonth(dateToUse);
    }).length;

    // 6. Joined (Month)
    const joinedMonth = filteredJoinings.filter((j) => {
      if (j.joiningStatus !== 'Joined') return false;
      const dateToUse = j.actualDoj || j.expectedDoj || j.createdAt;
      return matchesMonth(dateToUse);
    }).length;

    // 7. Offer Acceptance %
    const acceptedOffersCount = filteredOffers.filter(
      (o) => o.offerStatus === 'Accepted' || o.offerStatus === 'Joined'
    ).length;
    const totalOffersEvaluated = filteredOffers.filter((o) => o.offerStatus !== 'Draft').length;
    const offerAcceptancePct = totalOffersEvaluated > 0
      ? Math.round((acceptedOffersCount / totalOffersEvaluated) * 100)
      : 100;

    // 8. Pending Joinings
    const pendingJoinings = filteredJoinings.filter(
      (j) => !j.joiningStatus || j.joiningStatus === 'Pending Joining' || j.joiningStatus === 'Deferred'
    ).length;

    // 9. Overdue Follow-ups
    const overdueFollowUps = filteredFollowUps.filter((f) => {
      const isPending = !f.followUpStatus || f.followUpStatus === 'Open';
      if (!isPending) return false;
      const d = new Date(f.nextFollowUpDate || f.followUpDate);
      return d < startToday;
    }).length;

    // 10. Total Joined (All-time)
    const totalJoined = filteredJoinings.filter((j) => j.joiningStatus === 'Joined').length;

    // 11. Average Time to Hire (in days from Requisition DateRaised to actualDoj)
    const joinedWithDates = filteredJoinings.filter((j) => j.joiningStatus === 'Joined' && j.actualDoj);
    let avgTimeToHireDays = 0;
    if (joinedWithDates.length > 0) {
      const totalHireDays = joinedWithDates.reduce((acc, j) => {
        const cand = rawCandidates.find((c) => String(c._id) === String(j.candidateId) || c.candidateId === j.candidateIdStr);
        const req = rawRequisitions.find((r) => r.reqId === cand?.reqIdStr || String(r._id) === String(cand?.requisitionId));
        const start = req?.dateRaised ? new Date(req.dateRaised) : cand?.dateAdded ? new Date(cand.dateAdded) : new Date(j.createdAt);
        const end = new Date(j.actualDoj);
        const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        return acc + days;
      }, 0);
      avgTimeToHireDays = Math.round(totalHireDays / joinedWithDates.length);
    }

    // 12. Active Team Members Online
    const activeSessionsCount = rawSessions.filter((s) => s.status === 'Active').length;

    // 13. Onboarding Completion Rate %
    const totalChecklists = filteredChecklists.length;
    const completedChecklists = filteredChecklists.filter((c) => c.onboardingStatus === 'Completed').length;
    const onboardingCompletionRate = totalChecklists > 0
      ? Math.round((completedChecklists / totalChecklists) * 100)
      : 100;

    return {
      approvedPositions,
      openPositions,
      activeInPipeline,
      interviewsNext7Days,
      offersReleasedMonth,
      joinedMonth,
      offerAcceptancePct,
      pendingJoinings,
      overdueFollowUps,
      totalJoined,
      avgTimeToHireDays,
      activeSessionsCount,
      onboardingCompletionRate,
    };
  }, [
    filteredRequisitions,
    filteredCandidates,
    filteredPipeline,
    filteredInterviews,
    filteredOffers,
    filteredJoinings,
    filteredChecklists,
    filteredFollowUps,
    rawCandidates,
    rawRequisitions,
    rawSessions,
    matchesMonth,
  ]);

    // Website Careers Intelligence
  const websiteSummary = useMemo(() => {
    const totalJobs = rawWebsiteJobs.length;
    const publishedJobs = rawWebsiteJobs.filter((j) => j.isPublished !== false).length;
    const totalApps = rawWebsiteApps.length;
    const newApps = rawWebsiteApps.filter((a) => a.status === 'new' || !a.status).length;
    const reviewingApps = rawWebsiteApps.filter((a) => a.status === 'reviewing').length;
    const shortlistedApps = rawWebsiteApps.filter((a) => a.status === 'shortlisted').length;
    const hiredApps = rawWebsiteApps.filter((a) => a.status === 'hired').length;
    const recentApps = rawWebsiteApps.slice(0, 5);
    const topWebsiteJobs = rawWebsiteJobs.slice(0, 5);

    return {
      totalJobs,
      publishedJobs,
      totalApps,
      newApps,
      reviewingApps,
      shortlistedApps,
      hiredApps,
      recentApps,
      topWebsiteJobs,
    };
  }, [rawWebsiteJobs, rawWebsiteApps]);

  // Current Openings Table
  const currentOpeningsList = useMemo(() => {
    const today = new Date();
    return filteredRequisitions
      .filter((r) => r.approvalStatus === 'Approved' && r.requisitionStatus !== 'Closed' && r.requisitionStatus !== 'Cancelled')
      .map((r) => {
        const positions = Number(r.positionsRequired) || 1;
        const filled = Number(r.filled) || 0;
        const open = typeof r.open === 'number' ? r.open : Math.max(0, positions - filled);

        const candidateCount = filteredCandidates.filter(
          (c) => (c.reqIdStr && c.reqIdStr === r.reqId) || (c.requisitionId && String(c.requisitionId) === String(r._id))
        ).length;

        const raised = new Date(r.dateRaised || r.createdAt || today);
        const diffMs = Math.max(0, today.getTime() - raised.getTime());
        const ageingDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        return {
          _id: r._id,
          reqId: r.reqId || 'REQ',
          centre: r.centre || '-',
          department: r.department || '-',
          designation: r.designation || '-',
          positions,
          filled,
          open,
          candidates: candidateCount,
          priority: r.priority || 'Medium',
          recruiter: r.recruiterAssigned || '-',
          ageingDays,
        };
      });
  }, [filteredRequisitions, filteredCandidates]);

  // Department-wise Vacancies & Openings Breakdown
  const departmentBreakdown = useMemo(() => {
    const map = {};
    filteredRequisitions.forEach((r) => {
      const dept = r.department || 'General';
      if (!map[dept]) map[dept] = { department: dept, positions: 0, open: 0, filled: 0 };
      const pos = Number(r.positionsRequired) || 1;
      const f = Number(r.filled) || 0;
      const o = typeof r.open === 'number' ? r.open : Math.max(0, pos - f);
      map[dept].positions += pos;
      map[dept].filled += f;
      map[dept].open += o;
    });
    return Object.values(map).sort((a, b) => b.open - a.open).slice(0, 6);
  }, [filteredRequisitions]);

  // Recruiter Performance & Workload
  const recruiterWorkload = useMemo(() => {
    const map = {};
    filteredCandidates.forEach((c) => {
      const rec = c.recruiter || 'Unassigned';
      if (!map[rec]) map[rec] = { recruiter: rec, candidates: 0, offers: 0, joined: 0 };
      map[rec].candidates += 1;
    });
    filteredOffers.forEach((o) => {
      const cand = rawCandidates.find((c) => String(c._id) === String(o.candidateId) || c.candidateId === o.candidateIdStr);
      const rec = cand?.recruiter || 'Unassigned';
      if (!map[rec]) map[rec] = { recruiter: rec, candidates: 0, offers: 0, joined: 0 };
      map[rec].offers += 1;
    });
    filteredJoinings.forEach((j) => {
      if (j.joiningStatus === 'Joined') {
        const rec = j.recruiter || 'Unassigned';
        if (!map[rec]) map[rec] = { recruiter: rec, candidates: 0, offers: 0, joined: 0 };
        map[rec].joined += 1;
      }
    });
    return Object.values(map).filter((r) => r.recruiter !== 'Unassigned').sort((a, b) => b.candidates - a.candidates).slice(0, 5);
  }, [filteredCandidates, filteredOffers, filteredJoinings, rawCandidates]);

  // Live Onboarding Tracker Summary
  const onboardingSummary = useMemo(() => {
    return filteredChecklists.slice(0, 5).map((chk) => ({
      _id: chk._id,
      candidateName: chk.candidateName,
      centre: chk.centre,
      completionPct: chk.completionPct || 0,
      done: chk.done || 0,
      applicable: chk.applicable || 11,
      status: chk.onboardingStatus || 'In Progress',
    }));
  }, [filteredChecklists]);

  // Chart 1: Hiring Funnel
  const hiringFunnelData = useMemo(() => {
    const stages = [
      { key: 'Registered', count: filteredCandidates.length },
      { key: 'Interview Done', count: filteredInterviews.filter((i) => i.interviewStatus === 'Completed').length },
      { key: 'Offer Released', count: filteredOffers.length },
      { key: 'Joined', count: filteredJoinings.filter((j) => j.joiningStatus === 'Joined').length },
      { key: 'Rejected', count: filteredCandidates.filter((c) => c.currentStage === 'Rejected' || c.pipelineStatus === 'Rejected').length },
      { key: 'Dropped', count: filteredJoinings.filter((j) => j.joiningStatus === 'No Show' || j.joiningStatus === 'Offer Backed Out').length },
    ];
    const maxVal = Math.max(...stages.map((s) => s.count), 1);
    return { stages, maxVal };
  }, [filteredCandidates, filteredInterviews, filteredOffers, filteredJoinings]);

  // Chart 2: Source-wise: Sourced vs Joined
  const sourceWiseData = useMemo(() => {
    const defaultSources = [
      'Naukri',
      'LinkedIn',
      'Employee Referral',
      'Recruitment Agency',
      'Walk-in',
      'Job Fair / Campus',
      'Indeed',
      'Social Media',
      'Company Website',
      'Internal Database',
      'Other',
    ];

    const sourceMap = {};
    defaultSources.forEach((s) => {
      sourceMap[s] = { sourced: 0, joined: 0 };
    });

    filteredCandidates.forEach((c) => {
      const src = c.source || 'Other';
      if (!sourceMap[src]) sourceMap[src] = { sourced: 0, joined: 0 };
      sourceMap[src].sourced += 1;
    });

    filteredJoinings.forEach((j) => {
      if (j.joiningStatus === 'Joined') {
        const cand = rawCandidates.find(
          (c) => String(c._id) === String(j.candidateId) || (c.candidateId && c.candidateId === j.candidateIdStr)
        );
        const src = cand?.source || 'Other';
        if (!sourceMap[src]) sourceMap[src] = { sourced: 0, joined: 0 };
        sourceMap[src].joined += 1;
      }
    });

    const list = defaultSources.map((name) => ({
      name,
      sourced: sourceMap[name]?.sourced || 0,
      joined: sourceMap[name]?.joined || 0,
    }));

    const maxVal = Math.max(...list.map((s) => Math.max(s.sourced, s.joined)), 1);
    return { list, maxVal };
  }, [filteredCandidates, filteredJoinings, rawCandidates]);

  // Chart 3: Centre-wise: Approved vs Open Positions
  const centreWiseData = useMemo(() => {
    const list = centreOptions.map((cName) => {
      const reqsForCentre = rawRequisitions.filter((r) => (r.centre || '').toLowerCase() === cName.toLowerCase());
      const approved = reqsForCentre
        .filter((r) => r.approvalStatus === 'Approved')
        .reduce((sum, r) => sum + (Number(r.positionsRequired) || 1), 0);
      const open = reqsForCentre
        .filter((r) => r.approvalStatus === 'Approved' && r.requisitionStatus !== 'Closed' && r.requisitionStatus !== 'Cancelled')
        .reduce((sum, r) => {
          const count = typeof r.open === 'number' ? r.open : (Number(r.positionsRequired) || 1) - (Number(r.filled) || 0);
          return sum + Math.max(0, count);
        }, 0);
      return { centre: cName, approved, open };
    });

    const maxVal = Math.max(...list.map((c) => Math.max(c.approved, c.open)), 2);
    return { list, maxVal };
  }, [centreOptions, rawRequisitions]);

  // Chart 4: Monthly Trend: Offers vs Joined
  const monthlyTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = selYear;

    const dataPoints = months.map((mName, mIdx) => {
      const offersCount = filteredOffers.filter((o) => {
        const d = new Date(o.offerReleaseDate || o.offerRequestDate || o.createdAt);
        return d.getFullYear() === currentYear && d.getMonth() === mIdx;
      }).length;

      const joinedCount = filteredJoinings.filter((j) => {
        if (j.joiningStatus !== 'Joined') return false;
        const d = new Date(j.actualDoj || j.expectedDoj || j.createdAt);
        return d.getFullYear() === currentYear && d.getMonth() === mIdx;
      }).length;

      return { month: mName, offers: offersCount, joined: joinedCount };
    });

    const maxVal = Math.max(...dataPoints.map((d) => Math.max(d.offers, d.joined)), 1);
    return { dataPoints, maxVal, currentYear };
  }, [filteredOffers, filteredJoinings, selYear]);

  // Chart 5: Offers by Status (Donut Chart)
  const offersByStatusData = useMemo(() => {
    const statusCounts = {};
    filteredOffers.forEach((o) => {
      const st = o.offerStatus || 'Offer Released';
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    const total = filteredOffers.length;
    const items = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    return { items, total };
  }, [filteredOffers]);

  // Needs Attention Section 1: Interviews - next 7 days
  const needsInterviews = useMemo(() => {
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const in7Days = new Date(startToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    in7Days.setHours(23, 59, 59, 999);

    return filteredInterviews
      .filter((i) => {
        if (i.interviewStatus === 'Cancelled' || i.interviewStatus === 'Completed') return false;
        const d = new Date(i.interviewDate);
        return d >= startToday && d <= in7Days;
      })
      .slice(0, 5);
  }, [filteredInterviews]);

  // Needs Attention Section 2: Follow-ups overdue / due today
  const needsFollowUps = useMemo(() => {
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);

    return filteredFollowUps
      .filter((f) => {
        const isPending = !f.followUpStatus || f.followUpStatus === 'Open';
        if (!isPending) return false;
        const d = new Date(f.nextFollowUpDate || f.followUpDate);
        return d <= endToday;
      })
      .map((f) => {
        const todayZero = new Date();
        todayZero.setHours(0, 0, 0, 0);
        const fDate = new Date(f.nextFollowUpDate || f.followUpDate);
        const isOverdue = fDate < todayZero;
        return {
          ...f,
          alert: isOverdue ? 'Overdue' : 'Due Today',
          dateFormatted: formatDisplayDate(f.nextFollowUpDate || f.followUpDate),
        };
      })
      .slice(0, 5);
  }, [filteredFollowUps]);

  // Needs Attention Section 3: Pending joinings
  const needsJoinings = useMemo(() => {
    const today = new Date();
    return filteredJoinings
      .filter((j) => !j.joiningStatus || j.joiningStatus === 'Pending Joining')
      .map((j) => {
        const doj = j.expectedDoj ? new Date(j.expectedDoj) : null;
        let delayDays = 0;
        if (doj && doj < today) {
          delayDays = Math.floor((today.getTime() - doj.getTime()) / (1000 * 60 * 60 * 24));
        }
        return {
          ...j,
          expectedDojFormatted: formatDisplayDate(j.expectedDoj),
          delayDays,
        };
      })
      .slice(0, 5);
  }, [filteredJoinings]);

  // Needs Attention Section 4: Requisitions pending approval
  const needsRequisitions = useMemo(() => {
    return filteredRequisitions
      .filter((r) => !r.approvalStatus || r.approvalStatus === 'Pending')
      .map((r) => ({
        ...r,
        raisedFormatted: formatDisplayDate(r.dateRaised || r.createdAt),
      }))
      .slice(0, 5);
  }, [filteredRequisitions]);

  // Needs Attention Section 5: Vacancies open > 30 days
  const needsVacancies30Days = useMemo(() => {
    const today = new Date();
    return filteredRequisitions
      .filter((r) => r.approvalStatus === 'Approved' && r.requisitionStatus !== 'Closed' && r.requisitionStatus !== 'Cancelled')
      .map((r) => {
        const raised = new Date(r.dateRaised || r.createdAt || today);
        const diffMs = Math.max(0, today.getTime() - raised.getTime());
        const ageingDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const positions = Number(r.positionsRequired) || 1;
        const filled = Number(r.filled) || 0;
        const open = typeof r.open === 'number' ? r.open : Math.max(0, positions - filled);

        return {
          ...r,
          open,
          ageingDays,
        };
      })
      .filter((r) => r.ageingDays > 30 && r.open > 0)
      .slice(0, 5);
  }, [filteredRequisitions]);

  return (
    <div className="mt-2 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* Header Matching HR Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1 sm:px-0">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627] mb-1.5">
            Recruitment Analytics
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl pb-1">
            Executive Dashboard
          </h2>
          <p className="text-sm font-medium text-zinc-500 mt-2 max-w-xl">
            Live recruitment operations, hiring funnels, monthly offer-joining trends, and critical action items.
          </p>
        </div>

        {/* Top Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3.5 py-2 shadow-sm">
            <span className="text-xs font-bold text-zinc-500">Centre:</span>
            <select
              value={selectedCentre}
              onChange={(e) => setSelectedCentre(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-800 outline-none cursor-pointer"
            >
              <option value="All">All Centres</option>
              {centreOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3.5 py-2 shadow-sm">
            <span className="text-xs font-bold text-zinc-500">Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-800 outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={loadAllData}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#cc2627] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#b31e1e] hover:shadow-lg disabled:opacity-60"
          >
            <svg
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Top 2 Primary Showcase Metric Cards: Website Current Openings & Website Applications */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Card A: Website Current Openings */}
        <div
          onClick={() => onNavigate('openings')}
          className="group cursor-pointer rounded-3xl border-2 border-pink-200/90 bg-gradient-to-br from-white via-pink-50/20 to-pink-50/50 p-6 shadow-sm transition-all hover:shadow-md hover:border-pink-400 hover:-translate-y-0.5 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-pink-500 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-700">
                  Live Career Page Openings
                </span>
              </div>
              <h3 className="mt-1 text-lg font-black text-zinc-900">Website Current Openings</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Vacancies accepting candidate applications online</p>
            </div>
            <span className="rounded-xl border border-pink-200 bg-white px-3 py-1 text-xs font-bold text-pink-700 shadow-sm group-hover:bg-pink-600 group-hover:text-white transition">
              Openings →
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-6 border-t border-pink-100/80 pt-4">
            <div>
              <p className="text-3xl font-black text-zinc-900">{websiteSummary.publishedJobs}</p>
              <p className="text-xs font-semibold text-pink-700 mt-0.5">Published & Active</p>
            </div>
            <div className="border-l border-pink-200 pl-6">
              <p className="text-2xl font-black text-zinc-700">{websiteSummary.totalJobs}</p>
              <p className="text-xs font-semibold text-zinc-400 mt-0.5">Total Postings</p>
            </div>
          </div>
        </div>

        {/* Card B: Website Applications */}
        <div
          onClick={() => onNavigate('applications')}
          className="group cursor-pointer rounded-3xl border-2 border-teal-200/90 bg-gradient-to-br from-white via-teal-50/20 to-teal-50/50 p-6 shadow-sm transition-all hover:shadow-md hover:border-teal-400 hover:-translate-y-0.5 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  Candidate Resumes & CVs
                </span>
              </div>
              <h3 className="mt-1 text-lg font-black text-zinc-900">Website Applications</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Job applications received through website form</p>
            </div>
            <span className="rounded-xl border border-teal-200 bg-white px-3 py-1 text-xs font-bold text-teal-700 shadow-sm group-hover:bg-teal-600 group-hover:text-white transition">
              Review CVs →
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-6 border-t border-teal-100/80 pt-4">
            <div>
              <p className="text-3xl font-black text-zinc-900">{websiteSummary.totalApps}</p>
              <p className="text-xs font-semibold text-teal-700 mt-0.5">Total Applications</p>
            </div>
            <div className="border-l border-teal-200 pl-6">
              <p className="text-2xl font-black text-amber-600">{websiteSummary.newApps}</p>
              <p className="text-xs font-semibold text-zinc-400 mt-0.5">New / Unread</p>
            </div>
            <div className="border-l border-teal-200 pl-6">
              <p className="text-2xl font-black text-emerald-600">{websiteSummary.hiredApps}</p>
              <p className="text-xs font-semibold text-zinc-400 mt-0.5">Hired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {/* 1. Approved Positions */}
        <div
          onClick={() => onNavigate('requisitions')}
          className="group cursor-pointer rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#cc2627]/30 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-700">Approved</span>
            <span className="h-2 w-2 rounded-full bg-[#cc2627]" />
          </div>
          <p className="mt-3 text-2xl font-black text-zinc-900">{kpis.approvedPositions}</p>
          <p className="mt-1 text-[11px] font-semibold text-zinc-400">Total Positions</p>
        </div>

        {/* 2. Open Positions */}
        <div
          onClick={() => onNavigate('requisitions')}
          className="group cursor-pointer rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-700">Open Vacancies</span>
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </div>
          <p className="mt-3 text-2xl font-black text-zinc-900">{kpis.openPositions}</p>
          <p className="mt-1 text-[11px] font-semibold text-zinc-400">Positions Open</p>
        </div>

        {/* 3. Active in Pipeline */}
        <div
          onClick={() => onNavigate('pipeline')}
          className="group cursor-pointer rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-cyan-300 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-700">Pipeline</span>
            <span className="h-2 w-2 rounded-full bg-cyan-600" />
          </div>
          <p className="mt-3 text-2xl font-black text-zinc-900">{kpis.activeInPipeline}</p>
          <p className="mt-1 text-[11px] font-semibold text-zinc-400">Active Candidates</p>
        </div>

        {/* 4. Interviews - Next 7 Days */}
        <div
          onClick={() => onNavigate('interviews')}
          className="group cursor-pointer rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-purple-300 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-700">Interviews</span>
            <span className="h-2 w-2 rounded-full bg-purple-600" />
          </div>
          <p className="mt-3 text-2xl font-black text-zinc-900">{kpis.interviewsNext7Days}</p>
          <p className="mt-1 text-[11px] font-semibold text-zinc-400">Next 7 Days</p>
        </div>

        {/* 5. Offers Released */}
        <div
          onClick={() => onNavigate('offers')}
          className="group cursor-pointer rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-700">Offers</span>
            <span className="h-2 w-2 rounded-full bg-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-black text-zinc-900">{kpis.offersReleasedMonth}</p>
          <p className="mt-1 text-[11px] font-semibold text-zinc-400">This Month</p>
        </div>

        {/* 6. Joined (Month) */}
        <div
          onClick={() => onNavigate('joinings')}
          className="group cursor-pointer rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-700">Joined</span>
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-black text-zinc-900">{kpis.joinedMonth}</p>
          <p className="mt-1 text-[11px] font-semibold text-zinc-400">This Month</p>
        </div>

        {/* 7. Offer Acceptance % */}
        <div
          onClick={() => onNavigate('offers')}
          className="group cursor-pointer rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[#cc2627]/30 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-700">Acceptance</span>
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
          </div>
          <p className="mt-3 text-2xl font-black text-zinc-900">{kpis.offerAcceptancePct}%</p>
          <p className="mt-1 text-[11px] font-semibold text-zinc-400">Ratio</p>
        </div>
      </div>

      {/* Row 2: Secondary Focus KPIs (Expanded to 5 cards) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div
          onClick={() => onNavigate('joinings')}
          className="group cursor-pointer rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">Pending Joinings</span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[10px]">
              DOJ
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-zinc-900">{kpis.pendingJoinings}</p>
          <p className="mt-1 text-[10px] text-zinc-400">Awaiting arrival</p>
        </div>

        <div
          onClick={() => onNavigate('recruitment-followup')}
          className="group cursor-pointer rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">Overdue Follow-ups</span>
            <div className="h-7 w-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-[10px]">
              !
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-zinc-900">{kpis.overdueFollowUps}</p>
          <p className="mt-1 text-[10px] text-zinc-400">Passed due date</p>
        </div>

        <div
          onClick={() => onNavigate('joinings')}
          className="group cursor-pointer rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">Total Joined</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
              ✓
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-zinc-900">{kpis.totalJoined}</p>
          <p className="mt-1 text-[10px] text-zinc-400">All-time joined</p>
        </div>

        {/* Avg Time to Hire */}
        <div
          onClick={() => onNavigate('pipeline')}
          className="group cursor-pointer rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">Avg Time to Hire</span>
            <div className="h-7 w-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
              ⚡
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-zinc-900">{kpis.avgTimeToHireDays > 0 ? `${kpis.avgTimeToHireDays}d` : '-'}</p>
          <p className="mt-1 text-[10px] text-zinc-400">Req to DOJ days</p>
        </div>

        {/* Team Online & Sessions */}
        <div
          onClick={() => onNavigate('user-sessions')}
          className="group cursor-pointer rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">Team Online</span>
            <div className="h-7 w-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-[10px]">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-zinc-900">{kpis.activeSessionsCount}</p>
          <p className="mt-1 text-[10px] text-zinc-400">Active HR sessions</p>
        </div>
      </div>

      {/* Current Openings Table */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#cc2627]">Requisitions</p>
            <h3 className="text-base font-black text-zinc-900 mt-0.5">
              Current Openings ({currentOpeningsList.length} positions open)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('requisitions')}
            className="text-xs font-bold text-[#cc2627] hover:underline"
          >
            View All Openings →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-5 py-3.5 whitespace-nowrap">Req ID</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Centre</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Department</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Designation</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Positions</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Filled</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Open</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Candidates</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Priority</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Recruiter</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Ageing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {currentOpeningsList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-zinc-400 font-medium">
                    No active open requisitions found for the selected centre.
                  </td>
                </tr>
              ) : (
                currentOpeningsList.map((row) => (
                  <tr
                    key={row._id}
                    onClick={() => onNavigate('requisitions')}
                    className="cursor-pointer transition hover:bg-zinc-50/80"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-zinc-900">{row.reqId}</td>
                    <td className="px-5 py-3.5 font-medium text-zinc-700">{row.centre}</td>
                    <td className="px-5 py-3.5 font-medium text-zinc-600">{row.department}</td>
                    <td className="px-5 py-3.5 font-bold text-zinc-900">{row.designation}</td>
                    <td className="px-4 py-3.5 text-center font-semibold text-zinc-700">{row.positions}</td>
                    <td className="px-4 py-3.5 text-center font-semibold text-zinc-700">{row.filled}</td>
                    <td className="px-4 py-3.5 text-center font-black text-amber-600">{row.open}</td>
                    <td className="px-4 py-3.5 text-center font-black text-blue-600">{row.candidates}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        row.priority === 'High' || row.priority === 'Critical'
                          ? 'bg-rose-100 text-rose-700'
                          : row.priority === 'Low'
                          ? 'bg-zinc-100 text-zinc-600'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 font-medium">{row.recruiter}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-zinc-700">{row.ageingDays}d</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: Analytics Charts Trio */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart 1: Hiring Funnel */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#cc2627]">Pipeline Funnel</p>
            <h3 className="text-base font-black text-zinc-900 mt-0.5">Candidates by Stage</h3>
          </div>
          <div className="space-y-3">
            {hiringFunnelData.stages.map((st) => {
              const widthPct = Math.min(100, Math.round((st.count / hiringFunnelData.maxVal) * 100));
              return (
                <div key={st.key} className="flex items-center text-xs">
                  <span className="w-28 text-right pr-3 font-semibold text-zinc-600 truncate">{st.key}</span>
                  <div className="flex-1 bg-zinc-100 h-6 rounded-xl overflow-hidden relative">
                    <div
                      className="bg-gradient-to-r from-[#6e1111] to-[#cc2627] h-full transition-all duration-500 flex items-center justify-end pr-2 text-white text-[10px] font-bold"
                      style={{ width: `${Math.max(widthPct, st.count > 0 ? 10 : 0)}%` }}
                    >
                      {st.count > 0 ? st.count : ''}
                    </div>
                  </div>
                  <span className="w-8 pl-2 text-zinc-700 font-black text-xs">{st.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Source-wise */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#cc2627]">Conversion</p>
                <h3 className="text-base font-black text-zinc-900 mt-0.5">Source: Sourced vs Joined</h3>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-[#cc2627]">
                  <span className="h-2 w-2 bg-[#cc2627] rounded-full inline-block" /> Sourced
                </span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="h-2 w-2 bg-emerald-600 rounded-full inline-block" /> Joined
                </span>
              </div>
            </div>

            <div className="h-44 flex items-end justify-between gap-1 pt-6 pb-2 border-b border-zinc-100 px-1">
              {sourceWiseData.list.map((item) => {
                const sourcedHeight = Math.min(100, Math.round((item.sourced / sourceWiseData.maxVal) * 100));
                const joinedHeight = Math.min(100, Math.round((item.joined / sourceWiseData.maxVal) * 100));
                return (
                  <div key={item.name} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      <div
                        className="w-1/2 bg-[#cc2627] rounded-t-sm transition-all"
                        style={{ height: `${sourcedHeight}%` }}
                        title={`${item.name} Sourced: ${item.sourced}`}
                      />
                      <div
                        className="w-1/2 bg-emerald-500 rounded-t-sm transition-all"
                        style={{ height: `${joinedHeight}%` }}
                        title={`${item.name} Joined: ${item.joined}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between gap-1 text-[9px] font-medium text-zinc-500 pt-2 h-14 overflow-hidden">
              {sourceWiseData.list.map((item) => (
                <div key={item.name} className="flex-1 text-center -rotate-45 origin-top-left transform translate-y-2 truncate" title={item.name}>
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Centre-wise */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#cc2627]">Centres</p>
                <h3 className="text-base font-black text-zinc-900 mt-0.5">Approved vs Open</h3>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-[#cc2627]">
                  <span className="h-2 w-2 bg-[#cc2627] rounded-full inline-block" /> Approved
                </span>
                <span className="flex items-center gap-1 text-amber-500">
                  <span className="h-2 w-2 bg-amber-500 rounded-full inline-block" /> Open
                </span>
              </div>
            </div>

            <div className="h-44 flex items-end justify-between gap-1 pt-6 pb-2 border-b border-zinc-100 px-1">
              {centreWiseData.list.slice(0, 10).map((item) => {
                const appHeight = Math.min(100, Math.round((item.approved / centreWiseData.maxVal) * 100));
                const openHeight = Math.min(100, Math.round((item.open / centreWiseData.maxVal) * 100));
                return (
                  <div key={item.centre} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      <div
                        className="w-1/2 bg-[#cc2627] rounded-t-sm transition-all"
                        style={{ height: `${appHeight}%` }}
                        title={`${item.centre} Approved: ${item.approved}`}
                      />
                      <div
                        className="w-1/2 bg-amber-500 rounded-t-sm transition-all"
                        style={{ height: `${openHeight}%` }}
                        title={`${item.centre} Open: ${item.open}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between gap-1 text-[9px] font-medium text-zinc-500 pt-2 h-14 overflow-hidden">
              {centreWiseData.list.slice(0, 10).map((item) => (
                <div key={item.centre} className="flex-1 text-center -rotate-45 origin-top-left transform translate-y-2 truncate" title={item.centre}>
                  {item.centre}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: 2 Charts - Monthly Trend & Offers Donut */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#cc2627]">Annual Trend</p>
              <h3 className="text-base font-black text-zinc-900 mt-0.5">
                {monthlyTrendData.currentYear} Offers vs Joined
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-[#cc2627]">
                <span className="h-0.5 w-3 bg-[#cc2627] inline-block" /> Offers
              </span>
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="h-0.5 w-3 bg-emerald-600 inline-block" /> Joined
              </span>
            </div>
          </div>

          <div className="h-48 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
              {[0, 37.5, 75, 112.5, 150].map((yVal, i) => (
                <line key={i} x1="0" y1={yVal} x2="500" y2={yVal} stroke="#f4f4f5" strokeWidth="1" />
              ))}

              <polyline
                fill="none"
                stroke="#cc2627"
                strokeWidth="2.5"
                points={monthlyTrendData.dataPoints.map((d, i) => {
                  const x = (i / (monthlyTrendData.dataPoints.length - 1)) * 480 + 10;
                  const y = 140 - (d.offers / monthlyTrendData.maxVal) * 120;
                  return `${x},${y}`;
                }).join(' ')}
              />

              <polyline
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                points={monthlyTrendData.dataPoints.map((d, i) => {
                  const x = (i / (monthlyTrendData.dataPoints.length - 1)) * 480 + 10;
                  const y = 140 - (d.joined / monthlyTrendData.maxVal) * 120;
                  return `${x},${y}`;
                }).join(' ')}
              />

              {monthlyTrendData.dataPoints.map((d, i) => {
                const x = (i / (monthlyTrendData.dataPoints.length - 1)) * 480 + 10;
                const yOff = 140 - (d.offers / monthlyTrendData.maxVal) * 120;
                const yJoin = 140 - (d.joined / monthlyTrendData.maxVal) * 120;
                return (
                  <g key={i}>
                    {d.offers > 0 && <circle cx={x} cy={yOff} r="3.5" fill="#cc2627" />}
                    {d.joined > 0 && <circle cx={x} cy={yJoin} r="3.5" fill="#059669" />}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex justify-between text-[10px] font-semibold text-zinc-400 pt-2 border-t border-zinc-100">
            {monthlyTrendData.dataPoints.map((d) => (
              <span key={d.month}>{d.month}</span>
            ))}
          </div>
        </div>

        {/* Offers Donut */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#cc2627]">Distribution</p>
              <h3 className="text-base font-black text-zinc-900 mt-0.5">Offers by Status</h3>
            </div>
            <span className="text-xs font-bold text-zinc-500">
              Total: {offersByStatusData.total}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center my-auto py-2">
            <div className="relative h-44 w-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f4f4f5" strokeWidth="18" />
                {offersByStatusData.total > 0 ? (
                  (() => {
                    const circumference = 2 * Math.PI * 38;
                    let accumulatedPercent = 0;
                    const colors = ['#cc2627', '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'];
                    return offersByStatusData.items.map((item, idx) => {
                      const strokeDasharray = `${(item.pct / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                      accumulatedPercent += item.pct;
                      return (
                        <circle
                          key={item.status}
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke={colors[idx % colors.length]}
                          strokeWidth="18"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                        />
                      );
                    });
                  })()
                ) : (
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#cc2627" strokeWidth="18" strokeDasharray="238.76" />
                )}
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-zinc-900">{offersByStatusData.total}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Offers</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
              {offersByStatusData.items.length === 0 ? (
                <span className="text-zinc-400 text-xs">No offers recorded yet</span>
              ) : (
                offersByStatusData.items.map((it, idx) => {
                  const colors = ['#cc2627', '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'];
                  return (
                    <span key={it.status} className="flex items-center gap-1.5 text-zinc-700 font-semibold text-[11px]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                      {it.status} ({it.count})
                    </span>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Additional Operational Intelligence (Department Breakdown & Recruiter Performance) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Department Openings Breakdown */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#cc2627]">Workforce Demand</p>
              <h3 className="text-base font-black text-zinc-900 mt-0.5">Top Openings by Department</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('requisitions')}
              className="text-xs font-bold text-[#cc2627] hover:underline"
            >
              All Requisitions →
            </button>
          </div>

          {departmentBreakdown.length === 0 ? (
            <p className="py-8 text-center text-xs font-medium text-zinc-400">No open requisitions yet</p>
          ) : (
            <div className="space-y-4">
              {departmentBreakdown.map((dept) => {
                const maxDeptPos = Math.max(...departmentBreakdown.map((d) => d.positions), 1);
                const pct = Math.min(100, Math.round((dept.positions / maxDeptPos) * 100));
                return (
                  <div key={dept.department} className="text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-zinc-800">{dept.department}</span>
                      <span className="text-zinc-500 font-semibold">
                        <span className="text-amber-600 font-bold">{dept.open} Open</span> / {dept.positions} Total
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden flex">
                      <div className="bg-[#cc2627] h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recruiter Throughput & Productivity */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#cc2627]">Productivity</p>
              <h3 className="text-base font-black text-zinc-900 mt-0.5">Recruiter Throughput</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('source-performance')}
              className="text-xs font-bold text-[#cc2627] hover:underline"
            >
              Full Performance →
            </button>
          </div>

          {recruiterWorkload.length === 0 ? (
            <p className="py-8 text-center text-xs font-medium text-zinc-400">No recruiter data recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/75 text-zinc-500 font-bold uppercase text-[9px]">
                    <th className="px-3 py-2">Recruiter</th>
                    <th className="px-3 py-2 text-center">Candidates Sourced</th>
                    <th className="px-3 py-2 text-center">Offers Rolled</th>
                    <th className="px-3 py-2 text-center">Joinings Done</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recruiterWorkload.map((rec) => (
                    <tr key={rec.recruiter} className="hover:bg-zinc-50/80">
                      <td className="px-3 py-2.5 font-bold text-zinc-900">{rec.recruiter}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-blue-600">{rec.candidates}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-amber-600">{rec.offers}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-emerald-600">{rec.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

            {/* Website Careers Intelligence Section (Live Career Portal & Applications) */}
      <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#cc2627]">
                Online Portal Sync
              </p>
            </div>
            <h3 className="text-xl font-black text-zinc-900 mt-1">
              Website Careers & Candidate Applications
            </h3>
            <p className="text-xs font-medium text-zinc-500 mt-0.5">
              Live positions visible on seedsofinnocence.com/careers and real candidate resumes submitted online.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('openings')}
              className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300"
            >
              Manage Openings →
            </button>
            <button
              type="button"
              onClick={() => onNavigate('applications')}
              className="rounded-xl bg-[#cc2627] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#b31e1e]"
            >
              Review CVs ({websiteSummary.newApps} new) →
            </button>
          </div>
        </div>

        {/* 4 Mini KPI Cards for Website Careers */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div
            onClick={() => onNavigate('openings')}
            className="cursor-pointer rounded-2xl border border-pink-100 bg-pink-50/50 p-4 transition hover:bg-pink-50 hover:border-pink-200"
          >
            <span className="text-xs font-bold text-pink-700">Published Jobs</span>
            <p className="mt-2 text-2xl font-black text-zinc-900">{websiteSummary.publishedJobs}</p>
            <p className="text-[10px] text-zinc-500">{websiteSummary.totalJobs} total postings</p>
          </div>

          <div
            onClick={() => onNavigate('applications')}
            className="cursor-pointer rounded-2xl border border-teal-100 bg-teal-50/50 p-4 transition hover:bg-teal-50 hover:border-teal-200"
          >
            <span className="text-xs font-bold text-teal-700">Total CVs Received</span>
            <p className="mt-2 text-2xl font-black text-zinc-900">{websiteSummary.totalApps}</p>
            <p className="text-[10px] text-zinc-500">Website job forms</p>
          </div>

          <div
            onClick={() => onNavigate('applications')}
            className="cursor-pointer rounded-2xl border border-amber-100 bg-amber-50/50 p-4 transition hover:bg-amber-50 hover:border-amber-200"
          >
            <span className="text-xs font-bold text-amber-700">New / Unread CVs</span>
            <p className="mt-2 text-2xl font-black text-amber-700">{websiteSummary.newApps}</p>
            <p className="text-[10px] text-zinc-500">Awaiting screening</p>
          </div>

          <div
            onClick={() => onNavigate('applications')}
            className="cursor-pointer rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 transition hover:bg-emerald-50 hover:border-emerald-200"
          >
            <span className="text-xs font-bold text-emerald-700">Website Hires</span>
            <p className="mt-2 text-2xl font-black text-emerald-700">{websiteSummary.hiredApps}</p>
            <p className="text-[10px] text-zinc-500">Shortlisted: {websiteSummary.shortlistedApps}</p>
          </div>
        </div>

        {/* 2 Columns: Live Website Jobs List & Recent Website Applications */}
        <div className="grid gap-6 lg:grid-cols-2 pt-2">
          {/* Left: Live Openings on Website */}
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800">
                Live Website Openings
              </h4>
              <button
                type="button"
                onClick={() => onNavigate('openings')}
                className="text-[11px] font-bold text-[#cc2627] hover:underline"
              >
                View All ({websiteSummary.publishedJobs})
              </button>
            </div>

            {websiteSummary.topWebsiteJobs.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-400">No active website jobs published yet.</p>
            ) : (
              <div className="divide-y divide-zinc-200/60">
                {websiteSummary.topWebsiteJobs.map((job) => (
                  <div
                    key={job._id}
                    onClick={() => onNavigate('openings')}
                    className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/80 px-2 rounded-xl transition"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-bold text-zinc-900 truncate">
                        {job.title || job.positionTitle || 'Untitled Opening'}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {job.department || 'General'} • {job.location || 'Multiple Locations'} • {job.experience || 'Experience not specified'}
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Recent Candidate Applications from Website */}
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800">
                Recent Website Candidate Applications
              </h4>
              <button
                type="button"
                onClick={() => onNavigate('applications')}
                className="text-[11px] font-bold text-[#cc2627] hover:underline"
              >
                All Applications ({websiteSummary.totalApps})
              </button>
            </div>

            {websiteSummary.recentApps.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-400">No candidate applications received yet.</p>
            ) : (
              <div className="divide-y divide-zinc-200/60">
                {websiteSummary.recentApps.map((app) => (
                  <div
                    key={app._id}
                    onClick={() => onNavigate('applications')}
                    className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-white/80 px-2 rounded-xl transition"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-bold text-zinc-900 truncate">
                        {app.candidateName || app.name || 'Anonymous Applicant'}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                        Applied for: <span className="font-semibold text-zinc-700">{app.positionTitle || app.jobTitle || 'General Application'}</span> • {app.mobile || app.phone || app.email}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      app.status === 'hired'
                        ? 'bg-emerald-100 text-emerald-800'
                        : app.status === 'shortlisted'
                        ? 'bg-purple-100 text-purple-800'
                        : app.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : app.status === 'reviewing'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {app.status || 'new'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 6: Needs Attention (5 Actionable Cards) */}
      <div>
        <div className="mb-4 px-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#cc2627]">Action Center</p>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 mt-0.5">
            Needs Attention
          </h2>
        </div>

        {/* 3 Columns Top */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Card 1: Interviews */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="text-sm font-black text-zinc-900">Interviews - next 7 days</h3>
                <button
                  type="button"
                  onClick={() => onNavigate('interviews')}
                  className="text-xs font-bold text-[#cc2627] hover:underline"
                >
                  view all
                </button>
              </div>

              {needsInterviews.length === 0 ? (
                <div className="py-8 text-center text-xs font-medium text-zinc-400">
                  Nothing here - all clear.
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 mt-2 text-xs">
                  {needsInterviews.map((iv) => (
                    <div key={iv._id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-zinc-900">{iv.candidateName}</p>
                        <p className="text-[11px] text-zinc-500">{iv.designation} • {iv.interviewRound}</p>
                      </div>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                        {formatDisplayDate(iv.interviewDate)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Follow-ups */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="text-sm font-black text-zinc-900">Follow-ups overdue / due today</h3>
                <button
                  type="button"
                  onClick={() => onNavigate('recruitment-followup')}
                  className="text-xs font-bold text-[#cc2627] hover:underline"
                >
                  view all
                </button>
              </div>

              {needsFollowUps.length === 0 ? (
                <div className="py-8 text-center text-xs font-medium text-zinc-400">
                  Nothing here - all clear.
                </div>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/75 text-zinc-500 font-bold uppercase text-[9px]">
                        <th className="px-2.5 py-2">Due</th>
                        <th className="px-2.5 py-2">Candidate</th>
                        <th className="px-2.5 py-2">Centre</th>
                        <th className="px-2.5 py-2">Recruiter</th>
                        <th className="px-2.5 py-2 text-center">Alert</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {needsFollowUps.map((fu) => (
                        <tr key={fu._id} className="hover:bg-zinc-50/80">
                          <td className="px-2.5 py-2 font-semibold text-zinc-700">{fu.dateFormatted}</td>
                          <td className="px-2.5 py-2 font-bold text-zinc-900">{fu.candidateName}</td>
                          <td className="px-2.5 py-2 text-zinc-600">{fu.centre || '-'}</td>
                          <td className="px-2.5 py-2 text-zinc-600">{fu.recruiter || '-'}</td>
                          <td className="px-2.5 py-2 text-center">
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-700">
                              {fu.alert}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Pending joinings */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="text-sm font-black text-zinc-900">Pending joinings</h3>
                <button
                  type="button"
                  onClick={() => onNavigate('joinings')}
                  className="text-xs font-bold text-[#cc2627] hover:underline"
                >
                  view all
                </button>
              </div>

              {needsJoinings.length === 0 ? (
                <div className="py-8 text-center text-xs font-medium text-zinc-400">
                  Nothing here - all clear.
                </div>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/75 text-zinc-500 font-bold uppercase text-[9px]">
                        <th className="px-2.5 py-2">Candidate</th>
                        <th className="px-2.5 py-2">Centre</th>
                        <th className="px-2.5 py-2">Designation</th>
                        <th className="px-2.5 py-2">DOJ</th>
                        <th className="px-2.5 py-2 text-center">Delay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {needsJoinings.map((pj) => (
                        <tr key={pj._id} className="hover:bg-zinc-50/80">
                          <td className="px-2.5 py-2 font-bold text-zinc-900">{pj.candidateName}</td>
                          <td className="px-2.5 py-2 text-zinc-600">{pj.centre || '-'}</td>
                          <td className="px-2.5 py-2 text-zinc-600">{pj.designation || '-'}</td>
                          <td className="px-2.5 py-2 text-zinc-700 font-medium">{pj.expectedDojFormatted}</td>
                          <td className="px-2.5 py-2 text-center font-bold text-amber-600">
                            {pj.delayDays > 0 ? `${pj.delayDays}d` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2 Columns Bottom */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Card 4: Requisitions pending */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="text-sm font-black text-zinc-900">Requisitions pending approval</h3>
                <button
                  type="button"
                  onClick={() => onNavigate('requisitions')}
                  className="text-xs font-bold text-[#cc2627] hover:underline"
                >
                  view all
                </button>
              </div>

              {needsRequisitions.length === 0 ? (
                <div className="py-8 text-center text-xs font-medium text-zinc-400">
                  Nothing here - all clear.
                </div>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/75 text-zinc-500 font-bold uppercase text-[9px]">
                        <th className="px-3 py-2">Req ID</th>
                        <th className="px-3 py-2">Centre</th>
                        <th className="px-3 py-2">Designation</th>
                        <th className="px-3 py-2 text-center">Positions</th>
                        <th className="px-3 py-2">Raised</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {needsRequisitions.map((req) => (
                        <tr key={req._id} className="hover:bg-zinc-50/80">
                          <td className="px-3 py-2 font-mono font-bold text-zinc-900">{req.reqId}</td>
                          <td className="px-3 py-2 text-zinc-600">{req.centre}</td>
                          <td className="px-3 py-2 font-bold text-zinc-900">{req.designation}</td>
                          <td className="px-3 py-2 text-center font-bold text-zinc-700">{req.positionsRequired || 1}</td>
                          <td className="px-3 py-2 text-zinc-500 font-medium">{req.raisedFormatted}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Card 5: Vacancies open > 30 days */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="text-sm font-black text-zinc-900">Vacancies open &gt; 30 days</h3>
                <button
                  type="button"
                  onClick={() => onNavigate('requisitions')}
                  className="text-xs font-bold text-[#cc2627] hover:underline"
                >
                  view all
                </button>
              </div>

              {needsVacancies30Days.length === 0 ? (
                <div className="py-8 text-center text-xs font-medium text-zinc-400">
                  Nothing here - all clear.
                </div>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/75 text-zinc-500 font-bold uppercase text-[9px]">
                        <th className="px-3 py-2">Req ID</th>
                        <th className="px-3 py-2">Centre</th>
                        <th className="px-3 py-2">Designation</th>
                        <th className="px-3 py-2 text-center">Open</th>
                        <th className="px-3 py-2 text-center">Ageing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {needsVacancies30Days.map((vac) => (
                        <tr key={vac._id} className="hover:bg-zinc-50/80">
                          <td className="px-3 py-2 font-mono font-bold text-zinc-900">{vac.reqId}</td>
                          <td className="px-3 py-2 text-zinc-600">{vac.centre}</td>
                          <td className="px-3 py-2 font-bold text-zinc-900">{vac.designation}</td>
                          <td className="px-3 py-2 text-center font-bold text-amber-600">{vac.open}</td>
                          <td className="px-3 py-2 text-center font-bold text-rose-600">{vac.ageingDays}d</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
