const constants = require('utils/constants');
const db = require('utils/db');
const Question = db.Question;
const User = db.User;
const Request = db.Request;
var mongoose = require('mongoose');

async function create(userParam) {
    if (userParam.location == undefined || userParam.location.coordinates == undefined) {
        return ( { success: false, message: constants.QUESTION_CREATION_FAILED } );
    }

    const questionId = mongoose.Types.ObjectId();
    userParam._id = questionId;

    const question = new Question(userParam);

    try {
        await question.save();
    } catch {
        return ( { success: false, message: constants.QUESTION_CREATION_FAILED } )
    }

    // Send requests
    const users = await User.find({
        location: {
            $nearSphere: {
            $geometry: {
                type: 'Point',
                coordinates: userParam.location.coordinates
            },
            $maxDistance: 1000 // within 1 KM
            }
        }
    })
    
    for (var i = 0; i<users.length; i++) {
        var request = new Request({ user: users[i]._id, question_id: questionId, question: question.question })

        console.log(request);
        await request.save();
    }

    console.log(users);

    return ( { success: true, message: constants.QUESTION_CREATED_SUCCESSFULLY } )
}

async function getByUserId(uid) {
    return Question.find({ user: uid });
}

module.exports = {
    create,
    getByUserId
};