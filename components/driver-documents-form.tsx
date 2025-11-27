"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Car, Check, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function DriverDocumentsForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    nationalId: "",
    licenseNumber: "",
    licenseExpiry: "",
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleType: "small",
    licensePlate: "",
    insurance: null as File | null,
    registration: null as File | null,
    licensePhoto: null as File | null,
    vehiclePhoto: null as File | null,
  })
  const { toast } = useToast()

  const handleFileUpload = (field: string, file: File | null) => {
    setFormData({ ...formData, [field]: file })
  }

  const handleSubmit = async () => {
    // Validate all required fields
    if (!formData.fullName || !formData.phone || !formData.licenseNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Check vehicle year (must be 2020 or newer)
    const vehicleYear = Number.parseInt(formData.vehicleYear)
    if (vehicleYear < 2020) {
      toast({
        title: "Vehicle Not Eligible",
        description: "Only vehicles from 2020 or newer are accepted",
        variant: "destructive",
      })
      return
    }

    try {
      const form = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          form.append(key, value)
        } else if (value) {
          form.append(key, value.toString())
        }
      })

      const response = await fetch("/api/driver/documents", {
        method: "POST",
        body: form,
      })

      if (response.ok) {
        toast({
          title: "Documents Submitted",
          description: "Your application will be reviewed within 24-48 hours",
        })
        setStep(4) // Success step
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 mx-2 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Personal Information</h3>

            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="As shown on your ID"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+20 XXX XXX XXXX"
              />
            </div>

            <div className="space-y-2">
              <Label>National ID Number</Label>
              <Input
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                placeholder="14 digits"
                maxLength={14}
              />
            </div>

            <div className="space-y-2">
              <Label>Driver License Number</Label>
              <Input
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>License Expiry Date</Label>
              <Input
                type="date"
                value={formData.licenseExpiry}
                onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
              />
            </div>

            <Button className="w-full" onClick={() => setStep(2)}>
              Continue to Vehicle Info
            </Button>
          </div>
        )}

        {/* Step 2: Vehicle Info */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Vehicle Information</h3>

            <Card className="p-4 bg-accent/10 border-accent/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold">Vehicle Requirements</p>
                  <ul className="list-disc list-inside mt-1 text-muted-foreground">
                    <li>Must be 2020 model or newer</li>
                    <li>Valid registration and insurance</li>
                    <li>Clean and well-maintained</li>
                  </ul>
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <Label>Vehicle Year</Label>
              <Input
                type="number"
                min="2020"
                max={new Date().getFullYear() + 1}
                value={formData.vehicleYear}
                onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                placeholder="2020 or newer"
              />
            </div>

            <div className="space-y-2">
              <Label>Vehicle Make</Label>
              <Input
                value={formData.vehicleMake}
                onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                placeholder="Toyota, Honda, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Vehicle Model</Label>
              <Input
                value={formData.vehicleModel}
                onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                placeholder="Corolla, Civic, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
              >
                <option value="small">Small Car (Sedan)</option>
                <option value="big">Large Car (SUV/Van)</option>
                <option value="bike">Motorcycle/Bike</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>License Plate Number</Label>
              <Input
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
                Continue to Documents
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Document Uploads */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Upload Documents</h3>

            <div className="space-y-4">
              <DocumentUploadField
                label="Driver License Photo"
                icon={<FileText className="h-5 w-5" />}
                file={formData.licensePhoto}
                onChange={(file) => handleFileUpload("licensePhoto", file)}
              />

              <DocumentUploadField
                label="Vehicle Registration"
                icon={<Car className="h-5 w-5" />}
                file={formData.registration}
                onChange={(file) => handleFileUpload("registration", file)}
              />

              <DocumentUploadField
                label="Insurance Document"
                icon={<FileText className="h-5 w-5" />}
                file={formData.insurance}
                onChange={(file) => handleFileUpload("insurance", file)}
              />

              <DocumentUploadField
                label="Vehicle Photo"
                icon={<Car className="h-5 w-5" />}
                file={formData.vehiclePhoto}
                onChange={(file) => handleFileUpload("vehiclePhoto", file)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleSubmit}>
                Submit Application
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center space-y-4 py-8">
            <div className="h-16 w-16 rounded-full bg-chart-5/10 mx-auto flex items-center justify-center">
              <Check className="h-8 w-8 text-chart-5" />
            </div>
            <h3 className="text-2xl font-bold">Application Submitted!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We'll review your documents within 24-48 hours. You'll receive a notification once approved.
            </p>
            <Button className="mt-4">Return to Dashboard</Button>
          </div>
        )}
      </div>
    </Card>
  )
}

function DocumentUploadField({
  label,
  icon,
  file,
  onChange,
}: {
  label: string
  icon: React.ReactNode
  file: File | null
  onChange: (file: File | null) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className="hidden"
          id={`upload-${label}`}
        />
        <label htmlFor={`upload-${label}`} className="cursor-pointer flex items-center gap-3">
          {file ? (
            <>
              <div className="h-10 w-10 rounded-lg bg-chart-5/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-chart-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{file.name}</div>
                <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</div>
              </div>
            </>
          ) : (
            <>
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">{icon}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">Click to upload</div>
                <div className="text-xs text-muted-foreground">PDF or Image, max 5MB</div>
              </div>
              <Upload className="h-5 w-5 text-muted-foreground" />
            </>
          )}
        </label>
      </div>
    </div>
  )
}
