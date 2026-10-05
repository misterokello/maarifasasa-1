import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Trash2,
  Calendar,
  FileText,
  Mail,
  Phone,
  Link as LinkIcon,
  Type,
  Hash,
  CheckSquare,
  List,
  AlignLeft,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { format } from "date-fns";

interface SubmissionField {
  key: string;
  label: string;
  value: any;
  type: string;
}

interface Submission {
  id: string;
  createdAt: string;
  fields: SubmissionField[];
}

interface TallySubmissionDetailsProps {
  submission: Submission;
  formName: string;
  onBack: () => void;
  onDelete: () => void;
}

const getFieldIcon = (type: string) => {
  switch (type) {
    case "INPUT_EMAIL":
      return <Mail className="h-4 w-4" />;
    case "INPUT_PHONE_NUMBER":
      return <Phone className="h-4 w-4" />;
    case "INPUT_LINK":
      return <LinkIcon className="h-4 w-4" />;
    case "INPUT_NUMBER":
      return <Hash className="h-4 w-4" />;
    case "INPUT_TEXT":
      return <Type className="h-4 w-4" />;
    case "TEXTAREA":
      return <AlignLeft className="h-4 w-4" />;
    case "CHECKBOXES":
    case "CHECKBOX":
      return <CheckSquare className="h-4 w-4" />;
    case "MULTIPLE_CHOICE":
    case "DROPDOWN":
      return <List className="h-4 w-4" />;
    case "FILE_UPLOAD":
      return <Upload className="h-4 w-4" />;
    case "IMAGE":
      return <ImageIcon className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const formatFieldValue = (field: SubmissionField): React.ReactNode => {
  const { value, type } = field;

  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground italic">No response</span>;
  }

  // Handle arrays (checkboxes, multiple choice)
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground italic">No selection</span>;
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, i) => (
          <Badge key={i} variant="secondary">
            {typeof item === "object" ? item.name || JSON.stringify(item) : String(item)}
          </Badge>
        ))}
      </div>
    );
  }

  // Handle file uploads
  if (type === "FILE_UPLOAD" && typeof value === "object" && value.url) {
    return (
      <a
        href={value.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline flex items-center gap-1"
      >
        <Upload className="h-3 w-3" />
        {value.name || "View file"}
      </a>
    );
  }

  // Handle URLs
  if (type === "INPUT_LINK" && typeof value === "string" && value.startsWith("http")) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline break-all"
      >
        {value}
      </a>
    );
  }

  // Handle emails
  if (type === "INPUT_EMAIL" && typeof value === "string") {
    return (
      <a href={`mailto:${value}`} className="text-primary hover:underline">
        {value}
      </a>
    );
  }

  // Handle phone numbers
  if (type === "INPUT_PHONE_NUMBER" && typeof value === "string") {
    return (
      <a href={`tel:${value}`} className="text-primary hover:underline">
        {value}
      </a>
    );
  }

  // Handle objects
  if (typeof value === "object") {
    return <pre className="text-sm bg-muted p-2 rounded overflow-auto">{JSON.stringify(value, null, 2)}</pre>;
  }

  // Handle booleans
  if (typeof value === "boolean") {
    return value ? (
      <Badge className="bg-emerald-500/10 text-emerald-600">Yes</Badge>
    ) : (
      <Badge variant="secondary">No</Badge>
    );
  }

  // Default string rendering
  return <span className="whitespace-pre-wrap">{String(value)}</span>;
};

const TallySubmissionDetails = ({
  submission,
  formName,
  onBack,
  onDelete,
}: TallySubmissionDetailsProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Submission Details</h2>
            <p className="text-muted-foreground">{formName}</p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={onDelete}
          className="w-full sm:w-auto"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Submission
        </Button>
      </div>

      {/* Metadata */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Submitted on {format(new Date(submission.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="font-mono text-xs">
              ID: {submission.id}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Fields */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Form Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {submission.fields.map((field, index) => (
              <React.Fragment key={field.key}>
                {index > 0 && <Separator />}
                <div className="pt-2 first:pt-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    {getFieldIcon(field.type)}
                    <span>{field.label}</span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {field.type.replace("INPUT_", "").replace(/_/g, " ").toLowerCase()}
                    </Badge>
                  </div>
                  <div className="pl-6">{formatFieldValue(field)}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TallySubmissionDetails;
