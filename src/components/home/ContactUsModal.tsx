import { FC } from "react";
import { Modal } from "../common/Modal";
import { Phone } from "lucide-react";

interface ContactUsModalProps {
  onClose: () => void;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  image: string;
}

const contacts: Contact[] = [
  {
    id: "66708",
    name: "Md. Mehedi Hasan",
    phone: "01608989281",
    image: "https://hrms.waltonbd.com/images/repository/HrIrAplc/PIC_/104606~00bd50b5-414e-49d7-8b34-24a6245ead05.png",
  },
  {
    id: "54672",
    name: "Md. Al Amin",
    phone: "01678863782",
    image: "https://hrms.waltonbd.com/images/repository/HrCrEmp/PIC_/54672~bbfa70ea-bc10-4b4f-a4c5-6975ee563211.png",
  },
];

export const ContactUsModal: FC<ContactUsModalProps> = ({ onClose }) => {
  return (
    <Modal title="Contact Support" onClose={onClose}>
      <div className="max-w-lg mx-auto bg-gray-900 rounded-xl shadow-2xl p-6">
        <p className="text-gray-400 text-center mb-6 text-sm">
          Reach out to our developer team for assistance with any issues.
        </p>
        <ul className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {contacts.map((contact, index) => (
            <li
              key={contact.id}
              className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg animate-fade-pulse"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative">
                <img
                  src={contact.image}
                  alt={`${contact.name}'s profile`}
                  className="h-16 w-16 rounded-full object-contain border-2 border-green-500 shadow-md"
                 
                />
                <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400">
                  <strong className="text-gray-100">ID:</strong> {contact.id}
                </p>
                <p className="text-lg font-semibold text-gray-100">{contact.name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Phone className="w-4 h-4 text-green-400" />
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-base text-green-400 hover:text-green-300 transition-colors duration-200"
                    aria-label={`Call ${contact.name} at ${contact.phone}`}
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};