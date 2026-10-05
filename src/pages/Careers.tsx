import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, MapPin, Clock, ArrowRight, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Job {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string;
  summary: string | null;
  posted_at: string | null;
  closes_at: string | null;
}

const Careers = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("public_job_postings")
        .select("id, slug, title, department, location, employment_type, summary, posted_at, closes_at")
        .eq("status", "published")
        .eq("internal_only", false)
        .order("posted_at", { ascending: false });
      setJobs((data || []) as Job[]);
      setLoading(false);
    })();
  }, []);

  const departments = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.department).filter(Boolean))) as string[],
    [jobs]
  );
  const types = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.employment_type).filter(Boolean))) as string[],
    [jobs]
  );

  const filtered = jobs.filter((j) => {
    if (department !== "all" && j.department !== department) return false;
    if (type !== "all" && j.employment_type !== type) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !j.title.toLowerCase().includes(s) &&
        !(j.summary?.toLowerCase().includes(s)) &&
        !(j.location?.toLowerCase().includes(s))
      )
        return false;
    }
    return true;
  });

  return (
    <>
      <Helmet>
        <title>Careers at Maarifasasa — Build the future of work in Africa</title>
        <meta
          name="description"
          content="Join Maarifasasa and help unlock 1 million digital earning opportunities for African youth by 2030. Browse open roles in Kampala and beyond."
        />
        <meta property="og:title" content="Careers at Maarifasasa" />
        <meta
          property="og:description"
          content="Open roles across engineering, learning design, partnerships, and operations."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://maarifasasa.com/careers" />
        <link rel="canonical" href="https://maarifasasa.com/careers" />
      </Helmet>

      <section className="bg-gradient-to-br from-primary/10 via-background to-background pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4">
              We're hiring
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Build the future of work in Africa.
            </h1>
            <p className="text-lg text-muted-foreground">
              At Maarifasasa we're on a mission to unlock <strong>1 million</strong> digital earning
              opportunities for African youth by 2030. We hire on merit and actively encourage
              applications from women, persons with disabilities and youth from underrepresented
              communities.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-4 md:grid-cols-[1fr_220px_220px] mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, location, keyword…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Employment type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-1">No open roles match those filters</h3>
              <p className="text-muted-foreground">
                We're not currently hiring for that combination. Check back soon, or follow us on LinkedIn for new postings.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((job) => (
              <Link key={job.id} to={`/careers/${job.slug}`} className="block group">
                <Card className="transition-shadow group-hover:shadow-md">
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      {job.summary && (
                        <p className="text-muted-foreground mt-1 line-clamp-2">{job.summary}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                        {job.department && (
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" /> {job.department}
                          </span>
                        )}
                        {job.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {job.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {job.employment_type.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-primary font-medium">
                      View role <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-lg border bg-muted/40 p-6 text-sm text-muted-foreground">
          <strong className="text-foreground">Equal opportunity employer.</strong>{" "}
          Maarifasasa Limited is committed to fair, transparent and merit-based recruitment in line
          with our Recruitment & Selection Policy and Ugandan law. We do not discriminate on the
          basis of sex, age, marital status, religion, ethnicity, tribe, disability, HIV status,
          political opinion or any other protected ground. Reasonable accommodation will be provided
          on request.
        </div>
      </section>
    </>
  );
};

export default Careers;