'use client';

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
  type SpringOptions,
  AnimatePresence
} from 'motion/react';
import React, { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react';

import './Dock.css';

export type DockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  active?: boolean;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  baseItemWidth?: number;
  dockHeight?: number;
  magnification?: number;
  magnificationWidth?: number;
  spring?: SpringOptions;
  ariaLabel?: string;
  labelMode?: 'tooltip' | 'inline';
};

type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  baseItemWidth: number;
  magnification: number;
  magnificationWidth: number;
  label?: React.ReactNode;
  labelMode: 'tooltip' | 'inline';
  disabled?: boolean;
  active?: boolean;
};

function DockItem({
  children,
  className = '',
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  magnificationWidth,
  baseItemSize,
  baseItemWidth,
  label,
  labelMode,
  disabled = false,
  active = false
}: DockItemProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, val => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemWidth
    };
    return val - rect.x - rect.width / 2;
  });

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const size = useSpring(targetSize, spring);
  const targetWidth = useTransform(mouseDistance, [-distance, 0, distance], [baseItemWidth, magnificationWidth, baseItemWidth]);
  const width = useSpring(targetWidth, spring);

  return (
    <motion.button
      ref={ref}
      type="button"
      style={{
        width,
        height: size
      }}
      onHoverStart={() => !disabled && isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => !disabled && isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={disabled ? undefined : onClick}
      className={`dock-item ${active ? 'active' : ''} ${className ?? ''}`}
      disabled={disabled}
      aria-current={active ? 'step' : undefined}
      aria-label={typeof label === 'string' ? label : undefined}
    >
      {Children.map(children, child =>
        React.isValidElement(child) && child.type === DockLabel
          ? cloneElement(child as React.ReactElement<{ isHovered?: MotionValue<number> }>, { isHovered })
          : child
      )}
      {labelMode === 'inline' && <span className="dock-inline-label">{label}</span>}
    </motion.button>
  );
}

type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

function DockLabel({ children, className = '', isHovered }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on('change', latest => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`dock-label ${className}`}
          role="tooltip"
          style={{ x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type DockIconProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

function DockIcon({ children, className = '' }: DockIconProps) {
  return <div className={`dock-icon ${className}`}>{children}</div>;
}

export default function Dock({
  items,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 50,
  baseItemWidth = baseItemSize,
  ariaLabel = 'Application dock',
  labelMode = 'tooltip',
  magnificationWidth = magnification,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div style={{ height, scrollbarWidth: 'none' }} className="dock-outer">
      <motion.div
        onMouseMove={({ clientX }) => {
          isHovered.set(1);
          mouseX.set(clientX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={`dock-panel ${className}`}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label={ariaLabel}
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            magnificationWidth={magnificationWidth}
            baseItemSize={baseItemSize}
            baseItemWidth={baseItemWidth}
            label={item.label}
            labelMode={labelMode}
            disabled={item.disabled}
            active={item.active}
          >
            <DockIcon>{item.icon}</DockIcon>
            {labelMode === 'tooltip' && <DockLabel>{item.label}</DockLabel>}
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}
