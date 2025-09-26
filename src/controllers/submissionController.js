const supabase = require('../config/supabase');              
const logger = require('../utils/logger');

/**
 * Get all submissions from Idea table
 */
const getAllSubmissions = async (req, res) => {
  try {
    logger.info('Fetching all submissions from Idea table');
    
    // Use quoted column name for camelCase column
    const { data: submissions, error } = await supabase
      .from('Idea')
      .select('*')
      .order('"submittedAt"', { ascending: false });

    if (error) {
      logger.error('Error fetching submissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch submissions',
        error: error.message
      });
    }

    logger.info(`Successfully fetched ${submissions?.length || 0} submissions`);
    
    res.json({
      success: true,
      submissions: submissions || [],
      count: submissions?.length || 0
    });

  } catch (error) {
    logger.error('Unexpected error in getAllSubmissions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get single submission by ID
 */
const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Submission ID is required'
      });
    }

    logger.info(`Fetching submission with ID: ${id}`);
    
    const { data: submission, error } = await supabase
      .from('Idea')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }
      
      logger.error('Error fetching submission:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch submission',
        error: error.message
      });
    }

    logger.info(`Successfully fetched submission: ${submission.title}`);
    
    res.json({
      success: true,
      submission: submission
    });

  } catch (error) {
    logger.error('Unexpected error in getSubmissionById:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update submission by ID
 */
const updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Submission ID is required'
      });
    }

    // Remove id from updateData if present to avoid conflicts
    delete updateData.id;
    
    // Validate required fields if they're being updated
    const allowedFields = ['teamId', 'submittedBy', 'type', 'title', 'description', 'pptLink', 'githubLink', 'finalPptLink', 'figmaLink'];
    const updateFields = Object.keys(updateData).filter(key => allowedFields.includes(key));
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    logger.info(`Updating submission ${id} with fields: ${updateFields.join(', ')}`);
    
    const { data: updatedSubmission, error } = await supabase
      .from('Idea')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }
      
      logger.error('Error updating submission:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update submission',
        error: error.message
      });
    }

    // Log admin action
    try {
      const adminId = req.admin?.id;
      const adminEmail = req.admin?.email;
      
      await supabase
        .from('AdminActionLog')
        .insert({
          admin_id: adminId,
          action_type: 'UPDATE_SUBMISSION',
          target_id: id,
          details: `Updated submission "${updatedSubmission.title}" - Fields: ${updateFields.join(', ')}`,
          performed_by: adminEmail,
          performed_at: new Date().toISOString()
        });
    } catch (logError) {
      logger.error('Failed to log admin action:', logError);
      // Don't fail the main operation if logging fails
    }

    logger.info(`Successfully updated submission: ${updatedSubmission.title}`);
    
    res.json({
      success: true,
      message: 'Submission updated successfully',
      submission: updatedSubmission
    });

  } catch (error) {
    logger.error('Unexpected error in updateSubmission:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get submissions by team ID
 */
const getSubmissionsByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required'
      });
    }

    logger.info(`Fetching submissions for team: ${teamId}`);
    
    const { data: submissions, error } = await supabase
      .from('Idea')
      .select('*')
      .eq('teamId', teamId)
      .order('submittedAt', { ascending: false });

    if (error) {
      logger.error('Error fetching team submissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch team submissions',
        error: error.message
      });
    }

    logger.info(`Successfully fetched ${submissions?.length || 0} submissions for team ${teamId}`);
    
    res.json({
      success: true,
      submissions: submissions || [],
      count: submissions?.length || 0,
      teamId: teamId
    });

  } catch (error) {
    logger.error('Unexpected error in getSubmissionsByTeam:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get unique teams and types for filters
 */
const getSubmissionFilters = async (req, res) => {
  try {
    logger.info('Fetching submission filter options');
    
    // Get unique teams and types
    const { data: teams, error: teamsError } = await supabase
      .from('Idea')
      .select('teamId')
      .not('teamId', 'is', null);
      
    const { data: types, error: typesError } = await supabase
      .from('Idea')
      .select('type')
      .not('type', 'is', null);

    if (teamsError || typesError) {
      logger.error('Error fetching filter options:', teamsError || typesError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch filter options',
        error: (teamsError || typesError).message
      });
    }

    // Extract unique values
    const uniqueTeams = [...new Set(teams?.map(t => t.teamId).filter(Boolean))];
    const uniqueTypes = [...new Set(types?.map(t => t.type).filter(Boolean))];

    logger.info(`Found ${uniqueTeams.length} teams and ${uniqueTypes.length} types`);
    
    res.json({
      success: true,
      filters: {
        teams: uniqueTeams.sort(),
        types: uniqueTypes.sort()
      }
    });

  } catch (error) {
    logger.error('Unexpected error in getSubmissionFilters:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllSubmissions,
  getSubmissionById,
  updateSubmission,
  getSubmissionsByTeam,
  getSubmissionFilters
};