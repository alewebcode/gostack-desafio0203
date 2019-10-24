import { Op } from 'sequelize';
import { isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import Meetup from '../models/Meetup';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const { date } = req.query;
    const parsedDate = parseISO(date);
    const page = req.query.page || 1;
    console.log(parsedDate);
    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)],
        },
      },
      include: [User],
      limit: 10,
      offset: 10 * page - 10,
    });
    res.json(meetups);
  }

  async store(req, res) {
    const { title, description, localization, date, file_id } = req.body;
    const user_id = req.userId;

    if (isBefore(parseISO(date), new Date())) {
      res.status(400).json({ error: 'Date invalid' });
    }
    const meetup = await Meetup.create({
      title,
      description,
      localization,
      date,
      user_id,
      file_id,
    });

    res.json(meetup);
  }

  async update(req, res) {
    const { id } = req.params;
    const { date } = req.body;

    const meetup = await Meetup.findByPk(id);
    const user = req.userId;

    if (meetup.user_id !== user) {
      res.status(400).json({ error: 'User invalid' });
    }

    if (isBefore(parseISO(date), new Date())) {
      res.status(400).json({ error: 'Meetup date invalid' });
    }

    if (meetup.past) {
      res.status(400).json({ error: "Can't delete past meetups" });
    }

    await meetup.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const { id } = req.params;
    const user = req.userId;
    const meetup = await Meetup.findByPk(id);

    if (!meetup) {
      res.status(400).json({ error: 'Mettup dont exists' });
    }

    if (meetup.user_id !== user) {
      res.status(400).json({ error: 'User dont have permission' });
    }

    if (meetup.past) {
      res.status(400).json({ error: "Can't delete past meetups" });
    }

    await meetup.destroy();

    return res.send();
  }
}

export default new MeetupController();
