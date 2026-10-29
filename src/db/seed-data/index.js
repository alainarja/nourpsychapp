// One JSON file per collection; each maps 1:1 to a future MongoDB collection.
// Metro can't import a directory dynamically, so new collections are registered here.
import appointments from './appointments.json';
import goals from './goals.json';
import medications from './medications.json';
import messages from './messages.json';
import moods from './moods.json';
import notes from './notes.json';
import notifications from './notifications.json';
import orders from './orders.json';
import orgMembers from './orgMembers.json';
import paymentMethods from './paymentMethods.json';
import payouts from './payouts.json';
import prescriptions from './prescriptions.json';
import products from './products.json';
import reports from './reports.json';
import reviews from './reviews.json';
import users from './users.json';

export default {
  users, appointments, notes, products, orders, moods, goals, reviews, messages,
  notifications, medications, prescriptions, paymentMethods, payouts, orgMembers, reports,
};
