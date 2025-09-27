const supabase = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Add or update score for a team in a specific review round
 */
const addOrUpdateScore = async (req, res) => {
  try {
    const { team_id, review_number, points } = req.body;
    
    // Validate required fields
    if (!team_id || !review_number || points === undefined) {
      return res.status(400).json({
        success: false,
        message: 'team_id, review_number, and points are required'
      });
    }

    // Validate review_number (should be 1, 2, or 3)
    if (![1, 2, 3].includes(review_number)) {
      return res.status(400).json({
        success: false,
        message: 'review_number must be 1, 2, or 3'
      });
    }

    // Validate points (should be a number)
    if (typeof points !== 'number' || points < 0) {
      return res.status(400).json({
        success: false,
        message: 'points must be a non-negative number'
      });
    }

    logger.info(`Adding/updating score for team ${team_id}, review ${review_number}, points: ${points}`);

    // Check if score already exists for this team and review
    const { data: existingScore, error: checkError } = await supabase
      .from('Score')
      .select('*')
      .eq('team_id', team_id)
      .eq('review_number', review_number);

    if (checkError) {
      logger.error('Error checking existing score:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check existing score',
        error: checkError.message
      });
    }

    let result;
    if (existingScore && existingScore.length > 0) {
      // Update existing score
      const { data: updatedScore, error: updateError } = await supabase
        .from('Score')
        .update({ 
          points: points,
          updated_at: new Date().toISOString()
        })
        .eq('team_id', team_id)
        .eq('review_number', review_number)
        .select();

      if (updateError) {
        logger.error('Error updating score:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Failed to update score',
          error: updateError.message
        });
      }
      result = updatedScore[0];
      logger.info(`Updated score for team ${team_id}, review ${review_number}`);
    } else {
      // Insert new score
      const { data: newScore, error: insertError } = await supabase
        .from('Score')
        .insert([{
          team_id: team_id,
          review_number: review_number,
          points: points
        }])
        .select();

      if (insertError) {
        logger.error('Error inserting score:', insertError);
        return res.status(500).json({
          success: false,
          message: 'Failed to insert score',
          error: insertError.message
        });
      }
      result = newScore[0];
      logger.info(`Added new score for team ${team_id}, review ${review_number}`);
    }

    // Calculate and update total score for the team
    await updateTotalScore(team_id);

    res.json({
      success: true,
      message: 'Score added/updated successfully',
      score: result
    });

  } catch (error) {
    logger.error('Unexpected error in addOrUpdateScore:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get all scores for all teams
 */
const getAllScores = async (req, res) => {
  try {
    logger.info('Fetching all scores');

    const { data: scores, error } = await supabase
      .from('Score')
      .select('*')
      .order('team_id', { ascending: true })
      .order('review_number', { ascending: true });

    if (error) {
      logger.error('Error fetching scores:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch scores',
        error: error.message
      });
    }

    logger.info(`Successfully fetched ${scores?.length || 0} scores`);

    res.json({
      success: true,
      scores: scores || [],
      count: scores?.length || 0
    });

  } catch (error) {
    logger.error('Unexpected error in getAllScores:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get scores for a specific team
 */
const getTeamScores = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required'
      });
    }

    logger.info(`Fetching scores for team: ${teamId}`);

    const { data: scores, error } = await supabase
      .from('Score')
      .select('*')
      .eq('team_id', teamId)
      .order('review_number', { ascending: true });

    if (error) {
      logger.error('Error fetching team scores:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch team scores',
        error: error.message
      });
    }

    logger.info(`Successfully fetched ${scores?.length || 0} scores for team ${teamId}`);

    res.json({
      success: true,
      teamId: teamId,
      scores: scores || [],
      count: scores?.length || 0
    });

  } catch (error) {
    logger.error('Unexpected error in getTeamScores:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get leaderboard (teams sorted by total score)
 */
const getLeaderboard = async (req, res) => {
  try {
    logger.info('Fetching leaderboard');

    // Get unique teams with their total scores
    const { data: leaderboard, error } = await supabase
      .from('Score')
      .select('team_id, total_score')
      .not('total_score', 'is', null)
      .order('total_score', { ascending: false });

    if (error) {
      logger.error('Error fetching leaderboard:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch leaderboard',
        error: error.message
      });
    }

    // Remove duplicates and keep only unique teams
    const uniqueTeams = [];
    const seenTeams = new Set();
    
    leaderboard?.forEach(entry => {
      if (!seenTeams.has(entry.team_id)) {
        seenTeams.add(entry.team_id);
        uniqueTeams.push(entry);
      }
    });

    logger.info(`Successfully fetched leaderboard with ${uniqueTeams.length} teams`);

    res.json({
      success: true,
      leaderboard: uniqueTeams,
      count: uniqueTeams.length
    });

  } catch (error) {
    logger.error('Unexpected error in getLeaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Helper function to update total score for a team
 */
const updateTotalScore = async (team_id) => {
  try {
    // Get all scores for the team
    const { data: teamScores, error } = await supabase
      .from('Score')
      .select('points')
      .eq('team_id', team_id);

    if (error) {
      logger.error('Error fetching team scores for total calculation:', error);
      return;
    }

    // Calculate total score
    const totalScore = teamScores?.reduce((sum, score) => sum + (score.points || 0), 0) || 0;

    // Update total_score for all records of this team
    const { error: updateError } = await supabase
      .from('Score')
      .update({ total_score: totalScore })
      .eq('team_id', team_id);

    if (updateError) {
      logger.error('Error updating total score:', updateError);
    } else {
      logger.info(`Updated total score for team ${team_id}: ${totalScore}`);
    }

  } catch (error) {
    logger.error('Error in updateTotalScore:', error);
  }
};

/**
 * Delete a score entry
 */
const deleteScore = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Score ID is required'
      });
    }

    logger.info(`Deleting score with ID: ${id}`);

    // Get the score first to know which team to update total for
    const { data: scoreToDelete, error: fetchError } = await supabase
      .from('Score')
      .select('team_id')
      .eq('id', id);

    if (fetchError) {
      logger.error('Error fetching score to delete:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch score',
        error: fetchError.message
      });
    }

    if (!scoreToDelete || scoreToDelete.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Score not found'
      });
    }

    const team_id = scoreToDelete[0].team_id;

    // Delete the score
    const { error: deleteError } = await supabase
      .from('Score')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error('Error deleting score:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete score',
        error: deleteError.message
      });
    }

    // Update total score for the team
    await updateTotalScore(team_id);

    logger.info(`Successfully deleted score ${id}`);

    res.json({
      success: true,
      message: 'Score deleted successfully'
    });

  } catch (error) {
    logger.error('Unexpected error in deleteScore:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  addOrUpdateScore,
  getAllScores,
  getTeamScores,
  getLeaderboard,
  deleteScore
};