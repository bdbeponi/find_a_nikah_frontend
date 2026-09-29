// Every icon in the panel, drawn from Material Icons.
//
// Each glyph is wrapped once so call sites get 24px unless they pass a size,
// and so swapping the icon set later is one edit here rather than a
// find-and-replace across the app.
import {
  MdArrowBack,
  MdBadge,
  MdBlock,
  MdCampaign,
  MdCheckCircle,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdDashboard,
  MdFactCheck,
  MdFlag,
  MdGroup,
  MdHistory,
  MdHourglassEmpty,
  MdImage,
  MdLocalOffer,
  MdLogout,
  MdMenu,
  MdPaid,
  MdPersonOutline,
  MdSearch,
  MdSentimentDissatisfied,
  MdVerified,
} from "react-icons/md";

const wrap = (Glyph) =>
  function Icon({ size = 24, ...rest }) {
    return <Glyph size={size} {...rest} />;
  };

export const ArrowBack = wrap(MdArrowBack);
export const Badge = wrap(MdBadge);
export const Block = wrap(MdBlock);
export const Campaign = wrap(MdCampaign);
export const CheckCircle = wrap(MdCheckCircle);
export const ChevronLeft = wrap(MdChevronLeft);
export const ChevronRight = wrap(MdChevronRight);
export const Close = wrap(MdClose);
export const Dashboard = wrap(MdDashboard);
export const Profiles = wrap(MdFactCheck);
export const Flag = wrap(MdFlag);
export const Group = wrap(MdGroup);
export const History = wrap(MdHistory);
export const Pending = wrap(MdHourglassEmpty);
export const Photo = wrap(MdImage);
export const Plan = wrap(MdLocalOffer);
export const Money = wrap(MdPaid);
export const Logout = wrap(MdLogout);
export const Menu = wrap(MdMenu);
export const User = wrap(MdPersonOutline);
export const Search = wrap(MdSearch);
export const Empty = wrap(MdSentimentDissatisfied);
export const Verified = wrap(MdVerified);
