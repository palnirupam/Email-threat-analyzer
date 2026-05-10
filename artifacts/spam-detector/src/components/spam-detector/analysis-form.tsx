import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRef } from "react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Shield, X, Paperclip } from "lucide-react";
import type { EmailInput } from "@workspace/api-client-react";

const formSchema = z.object({
  sender_email: z.string().email("Invalid email format").or(z.literal("")),
  subject: z.string(),
  email_body: z.string(),
  attachments: z.string().optional(),
}).refine(data => data.subject.trim() || data.email_body.trim(), {
  message: "Either Subject or Email Body is required for analysis",
  path: ["email_body"]
});

interface AnalysisFormProps {
  onSubmit: (data: EmailInput) => void;
  onClear: () => void;
  isLoading: boolean;
}

export function AnalysisForm({ onSubmit, onClear, isLoading }: AnalysisFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sender_email: "",
      subject: "",
      email_body: "",
      attachments: "",
    },
  });

  const handleClear = () => {
    form.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClear();
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>, onChange: (v: string) => void) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const names = files.map(f => f.name).join(", ");
    const current = form.getValues("attachments") || "";
    const merged = current.trim()
      ? `${current.trim()}, ${names}`
      : names;
    onChange(merged);
    // reset so same files can be picked again if needed
    e.target.value = "";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sender_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Sender Email</FormLabel>
                <FormControl>
                  <Input placeholder="suspicious@example.com" className="font-mono bg-background border-muted" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Subject Line</FormLabel>
                <FormControl>
                  <Input placeholder="URGENT: Account Action Required" className="font-mono bg-background border-muted" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="attachments"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Attachment Metadata (Comma separated filenames)</FormLabel>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Paperclip className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <FormControl>
                    <Input
                      placeholder="invoice.pdf, payload.exe"
                      className="font-mono bg-background border-muted pl-9"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilePick(e, field.onChange)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 font-mono text-xs shrink-0 border-muted text-muted-foreground hover:text-foreground"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                  Browse
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email_body"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Raw Email Body</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Paste the suspicious email content here..." 
                  className="min-h-[250px] font-mono resize-y bg-background border-muted" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between items-center pt-4 border-t border-border mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClear}
            disabled={isLoading}
            className="font-mono"
          >
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="font-mono bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shield className="mr-2 h-4 w-4" />
            )}
            Run Analysis
          </Button>
        </div>
      </form>
    </Form>
  );
}
