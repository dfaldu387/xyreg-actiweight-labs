import { supabase } from "@/integrations/supabase/client";
import { UserNeedsService } from "./userNeedsService";

export class TraceabilityService {
  /**
   * Updates bidirectional links between hazard and requirements
   */
  static async updateHazardRequirementLinks(
    hazardId: string,
    requirementIds: string[]
  ): Promise<void> {
    try {
      // First, get all existing requirements to clear old links
      const { data: allRequirements, error: fetchError } = await supabase
        .from('requirement_specifications')
        .select('id, requirement_id, linked_risks')
        .like('linked_risks', `%${hazardId}%`);

      if (fetchError) {
        throw new Error(`Failed to fetch existing requirements: ${fetchError.message}`);
      }

      // Remove this hazard from all requirements that currently reference it
      for (const requirement of allRequirements || []) {
        const currentLinks = requirement.linked_risks
          ? requirement.linked_risks.split(',').map(id => id.trim()).filter(Boolean)
          : [];
        
        const updatedLinks = currentLinks.filter(id => id !== hazardId);
        
        const { error: updateError } = await supabase
          .from('requirement_specifications')
          .update({ linked_risks: updatedLinks.join(', ') })
          .eq('id', requirement.id);

        if (updateError) {
          console.error(`Failed to update requirement ${requirement.id}:`, updateError);
        }
      }

      // Add this hazard to the newly selected requirements
      for (const requirementId of requirementIds) {
        const { data: requirement, error: fetchError } = await supabase
          .from('requirement_specifications')
          .select('id, linked_risks')
          .eq('requirement_id', requirementId)
          .single();

        if (fetchError) {
          console.error(`Failed to fetch requirement ${requirementId}:`, fetchError);
          continue;
        }

        const currentLinks = requirement.linked_risks
          ? requirement.linked_risks.split(',').map(id => id.trim()).filter(Boolean)
          : [];

        // Add the hazard if not already linked
        if (!currentLinks.includes(hazardId)) {
          currentLinks.push(hazardId);
          
          const { error: updateError } = await supabase
            .from('requirement_specifications')
            .update({ linked_risks: currentLinks.join(', ') })
            .eq('id', requirement.id);

          if (updateError) {
            console.error(`Failed to update requirement ${requirement.id}:`, updateError);
          }
        }
      }
    } catch (error) {
      console.error('Error updating hazard-requirement links:', error);
      throw error;
    }
  }

  /**
   * Removes all links to a hazard when it's deleted
   */
  static async removeHazardLinks(hazardId: string): Promise<void> {
    try {
      const { data: requirements, error: fetchError } = await supabase
        .from('requirement_specifications')
        .select('id, linked_risks')
        .like('linked_risks', `%${hazardId}%`);

      if (fetchError) {
        throw new Error(`Failed to fetch requirements: ${fetchError.message}`);
      }

      for (const requirement of requirements || []) {
        const currentLinks = requirement.linked_risks
          ? requirement.linked_risks.split(',').map(id => id.trim()).filter(Boolean)
          : [];
        
        const updatedLinks = currentLinks.filter(id => id !== hazardId);
        
        const { error: updateError } = await supabase
          .from('requirement_specifications')
          .update({ linked_risks: updatedLinks.join(', ') })
          .eq('id', requirement.id);

        if (updateError) {
          console.error(`Failed to update requirement ${requirement.id}:`, updateError);
        }
      }
    } catch (error) {
      console.error('Error removing hazard links:', error);
      throw error;
    }
  }

  /**
   * Updates bidirectional links between requirement and user needs
   */
  static async updateRequirementUserNeedLinks(
    requirementId: string,
    userNeedIds: string[]
  ): Promise<void> {
    try {
      // First, get all existing user needs to clear old links
      const { data: allUserNeeds, error: fetchError } = await supabase
        .from('user_needs')
        .select('id, user_need_id, linked_requirements')
        .like('linked_requirements', `%${requirementId}%`);

      if (fetchError) {
        throw new Error(`Failed to fetch existing user needs: ${fetchError.message}`);
      }

      // Remove this requirement from all user needs that currently reference it
      for (const userNeed of allUserNeeds || []) {
        const currentLinks = userNeed.linked_requirements
          ? userNeed.linked_requirements.split(',').map(id => id.trim()).filter(Boolean)
          : [];
        
        const updatedLinks = currentLinks.filter(id => id !== requirementId);
        
        const { error: updateError } = await supabase
          .from('user_needs')
          .update({ linked_requirements: updatedLinks.join(', ') })
          .eq('id', userNeed.id);

        if (updateError) {
          console.error(`Failed to update user need ${userNeed.id}:`, updateError);
        }
      }

      // Add this requirement to the newly selected user needs
      for (const userNeedId of userNeedIds) {
        const { data: userNeed, error: fetchError } = await supabase
          .from('user_needs')
          .select('id, linked_requirements')
          .eq('user_need_id', userNeedId)
          .single();

        if (fetchError) {
          console.error(`Failed to fetch user need ${userNeedId}:`, fetchError);
          continue;
        }

        const currentLinks = userNeed.linked_requirements
          ? userNeed.linked_requirements.split(',').map(id => id.trim()).filter(Boolean)
          : [];

        // Add the requirement if not already linked
        if (!currentLinks.includes(requirementId)) {
          currentLinks.push(requirementId);
          
          const { error: updateError } = await supabase
            .from('user_needs')
            .update({ linked_requirements: currentLinks.join(', ') })
            .eq('id', userNeed.id);

          if (updateError) {
            console.error(`Failed to update user need ${userNeed.id}:`, updateError);
          }
        }
      }
    } catch (error) {
      console.error('Error updating requirement-user need links:', error);
      throw error;
    }
  }

  /**
   * Removes all links to a requirement when it's deleted
   */
  static async removeRequirementLinks(requirementId: string): Promise<void> {
    try {
      const { data: userNeeds, error: fetchError } = await supabase
        .from('user_needs')
        .select('id, linked_requirements')
        .like('linked_requirements', `%${requirementId}%`);

      if (fetchError) {
        throw new Error(`Failed to fetch user needs: ${fetchError.message}`);
      }

      for (const userNeed of userNeeds || []) {
        const currentLinks = userNeed.linked_requirements
          ? userNeed.linked_requirements.split(',').map(id => id.trim()).filter(Boolean)
          : [];
        
        const updatedLinks = currentLinks.filter(id => id !== requirementId);
        
        const { error: updateError } = await supabase
          .from('user_needs')
          .update({ linked_requirements: updatedLinks.join(', ') })
          .eq('id', userNeed.id);

        if (updateError) {
          console.error(`Failed to update user need ${userNeed.id}:`, updateError);
        }
      }
    } catch (error) {
      console.error('Error removing requirement links:', error);
      throw error;
    }
  }
}

export const traceabilityService = TraceabilityService;