# Proposal: Công nợ AI MVP

## Why
Small business owners in Vietnam currently track customer debts manually using notebooks or spreadsheets. This is slow, error-prone, and hard to query. An AI-powered natural language input system can dramatically speed up data entry and reduce mistakes.

## What We're Building
A mobile-first web app (Vite React + Supabase) called "Công nợ AI" that lets business owners:
1. Log debt entries using natural language (text or voice)
2. Have AI parse the input into structured data
3. View unpaid/paid orders grouped by customer
4. Mark orders as paid in bulk

## Scope
- Google OAuth login only (no signup flow)
- AI input using text + Web Speech API (voice)
- Supabase table `chi_tiet` as single source of truth
- Mobile-first UI with dark mode support
- 3-tab bottom navigation

## Out of Scope (MVP)
- Multi-user / team support
- Export to Excel/PDF
- SMS/email notifications
- Custom AI model training
