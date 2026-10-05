import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";

interface LearningPreferencesSectionProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const LearningPreferencesSection = ({ formData, setFormData }: LearningPreferencesSectionProps) => {
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [goalInput, setGoalInput] = useState("");

  const addItem = (type: 'skills' | 'interests' | 'learning_goals', value: string) => {
    if (!value.trim()) return;
    const current = formData[type] || [];
    if (!current.includes(value.trim())) {
      setFormData({ ...formData, [type]: [...current, value.trim()] });
    }
    if (type === 'skills') setSkillInput("");
    if (type === 'interests') setInterestInput("");
    if (type === 'learning_goals') setGoalInput("");
  };

  const removeItem = (type: 'skills' | 'interests' | 'learning_goals', value: string) => {
    const current = formData[type] || [];
    setFormData({ ...formData, [type]: current.filter((item: string) => item !== value) });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Learning Preferences</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="skills">Skills</Label>
          <div className="flex gap-2">
            <Input
              id="skills"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('skills', skillInput))}
              placeholder="Add a skill and press Enter"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(formData.skills || []).map((skill: string) => (
              <Badge key={skill} variant="secondary" className="gap-1">
                {skill}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeItem('skills', skill)}
                />
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interests">Interests</Label>
          <div className="flex gap-2">
            <Input
              id="interests"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('interests', interestInput))}
              placeholder="Add an interest and press Enter"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(formData.interests || []).map((interest: string) => (
              <Badge key={interest} variant="secondary" className="gap-1">
                {interest}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeItem('interests', interest)}
                />
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="learning_goals">Learning Goals</Label>
          <div className="flex gap-2">
            <Input
              id="learning_goals"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('learning_goals', goalInput))}
              placeholder="Add a learning goal and press Enter"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(formData.learning_goals || []).map((goal: string) => (
              <Badge key={goal} variant="secondary" className="gap-1">
                {goal}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeItem('learning_goals', goal)}
                />
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
