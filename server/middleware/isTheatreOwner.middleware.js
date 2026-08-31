import Theatre from '../model/theatre.model.js';

const isTheatreOwnerMiddleware =  async function(req, res, next) {
    try {
        const theatreDetails = await Theatre.findById(req.body.theatre);
        if (!theatreDetails || theatreDetails.owner.toString() !== req.user.userId) {
            throw new Error(`You aren't the owner of ${theatreDetails?.name ?? 'this theatre'}`);
        }
        return next();
    } catch(e) {
        res.status(403).send({
            success: false,
            message: e.message
        })
    }
}

export default isTheatreOwnerMiddleware;