import React from "react";
import { useRouter } from "next/navigation";
import styles from "./EventCard.module.css";
import {
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  StarIcon,
  TicketIcon,
} from "@/components/icons";

export interface EventCardProps {
  id: string;
  title: string;
  image: string;
  category: string;
  categoryBadge?: { label: string; bg: string; color: string; border: string };
  date: string;
  time?: string;
  venue: string;
  price: string;
  ticketsRemaining?: number;
  rating?: number;
  onClick?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({
  id,
  title,
  image,
  category,
  categoryBadge,
  date,
  time,
  venue,
  price,
  ticketsRemaining,
  rating = 4.8,
  onClick,
}) => {
  const router = useRouter();

  const handleClick = () => {
    onClick ? onClick() : router.push(`/events/${id}`);
  };

  const badgeStyle = categoryBadge
    ? {
        background: categoryBadge.bg,
        color: categoryBadge.color,
        border: categoryBadge.border,
      }
    : {};

  return (
    <div className={styles.cardContainer} onClick={handleClick}>
      <div className={styles.cardImageWrapper}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={title} className={styles.cardImage} />

        {/* Gradient overlay */}
        <div className={styles.cardOverlay} />

        {/* Top badges */}
        <div className={styles.badgeGroup}>
          <span className={styles.categoryTag}>{category}</span>
          {categoryBadge && (
            <span className={styles.categoryBadge} style={badgeStyle}>
              {categoryBadge.label}
            </span>
          )}
        </div>

        {/* Rating */}
        {rating && (
          <div className={styles.ratingBadge}>
            <StarIcon size={12} fill="currentColor" />
            <span>{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Tickets remaining indicator */}
        {ticketsRemaining && ticketsRemaining < 100 && (
          <div className={styles.ticketsWarning}>
            ÚLTIMOS {ticketsRemaining} INGRESSOS
          </div>
        )}
      </div>

      {/* Card content */}
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle} title={title}>
            {title}
          </h3>
        </div>

        {/* Metadata */}
        <div className={styles.metaGroup}>
          <div className={styles.metaItem}>
            <CalendarIcon size={13} />
            <span className={styles.metaText}>{date}</span>
            {time && (
              <>
                <span className={styles.metaDot}>·</span>
                <ClockIcon size={13} />
                <span className={styles.metaText}>{time}</span>
              </>
            )}
          </div>
          <div className={styles.metaItem}>
            <MapPinIcon size={13} />
            <span className={styles.metaText} title={venue}>
              {venue}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.cardFooter}>
          <div className={styles.priceInfo}>
            <span className={styles.priceLabel}>A partir de</span>
            <span className={styles.priceValue}>{price}</span>
          </div>
          <button className={styles.ctaButton} onClick={(e) => e.stopPropagation()}>
            <TicketIcon size={13} />
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
